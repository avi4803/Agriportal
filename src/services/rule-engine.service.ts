import { ruleRepository } from '../repositories/rule.repository.js';
import { alertRepository } from '../repositories/alert.repository.js';
import { notificationPreferenceRepository } from '../repositories/notification-preference.repository.js';
import { emitAlert } from '../sockets/socket-gateway.js';
import { logger } from '../utils/logger.js';
import { Severity } from '@prisma/client';

export interface ConditionNode {
  field?: string;
  op?: 'lt' | 'gt' | 'eq' | 'lte' | 'gte';
  value?: any;
  all?: ConditionNode[];
  any?: ConditionNode[];
}

export interface NotificationDispatcher {
  channel: string;
  dispatch(farmId: string, alert: any): Promise<void>;
}

export class InAppNotificationDispatcher implements NotificationDispatcher {
  channel = 'IN_APP';
  async dispatch(farmId: string, alert: any): Promise<void> {
    emitAlert(farmId, alert);
  }
}

const SEVERITY_RANK: Record<Severity, number> = {
  INFO: 1,
  WARNING: 2,
  CRITICAL: 3,
};

export class RuleEngineService {
  private dispatchers: Map<string, NotificationDispatcher> = new Map();

  constructor() {
    this.registerDispatcher(new InAppNotificationDispatcher());
    // Extension point: Telegram bot, SMS, Webhook dispatchers can be registered here.
  }

  registerDispatcher(dispatcher: NotificationDispatcher) {
    this.dispatchers.set(dispatcher.channel, dispatcher);
  }

  /**
   * Generic recursive condition evaluator supporting 'all', 'any', and leaf comparisons.
   */
  evaluateCondition(condition: ConditionNode, dataContext: Record<string, any>): boolean {
    if (condition.all && Array.isArray(condition.all)) {
      return condition.all.every((sub) => this.evaluateCondition(sub, dataContext));
    }

    if (condition.any && Array.isArray(condition.any)) {
      return condition.any.some((sub) => this.evaluateCondition(sub, dataContext));
    }

    if (condition.field && condition.op !== undefined && condition.value !== undefined) {
      const actualVal = dataContext[condition.field];
      if (actualVal === undefined || actualVal === null) {
        return false;
      }

      const expected = condition.value;
      switch (condition.op) {
        case 'lt':
          return Number(actualVal) < Number(expected);
        case 'gt':
          return Number(actualVal) > Number(expected);
        case 'lte':
          return Number(actualVal) <= Number(expected);
        case 'gte':
          return Number(actualVal) >= Number(expected);
        case 'eq':
          return actualVal === expected;
        default:
          return false;
      }
    }

    return false;
  }

  /**
   * Synchronously evaluated immediately after each telemetry batch.
   */
  async evaluate(
    farmId: string,
    deviceId: string,
    telemetryPayload: Record<string, any>,
    predictions: { type: string; value: number }[]
  ): Promise<void> {
    const rules = await ruleRepository.findActiveByFarmId(farmId);
    if (!rules.length) return;

    // Flatten dataContext with sensor readings + predicted values (e.g. vpd, cwsi)
    const dataContext: Record<string, any> = { ...telemetryPayload };
    for (const pred of predictions) {
      dataContext[pred.type.toLowerCase()] = pred.value;
      dataContext[pred.type] = pred.value;
    }

    for (const rule of rules) {
      try {
        const isMatch = this.evaluateCondition(rule.condition as ConditionNode, dataContext);
        if (isMatch) {
          const action = (rule.action as any) || {};
          const severity: Severity = action.severity || 'WARNING';
          const message = action.messageTemplate || `Threshold alert triggered for rule "${rule.name}"`;

          // 1. Create alert row in database
          const alert = await alertRepository.create({
            ruleId: rule.id,
            deviceId,
            severity,
            message,
          });

          // 2. Dispatch alert via registered channels
          const dispatcher = this.dispatchers.get('IN_APP');
          if (dispatcher) {
            await dispatcher.dispatch(farmId, alert);
          }
        }
      } catch (err: any) {
        logger.error({ err: err.message, ruleId: rule.id }, 'Error evaluating rule');
      }
    }
  }
}

export const ruleEngineService = new RuleEngineService();
