import type { SalaryDeductionRule } from '@/types/finance';

function resolveRuleType(rule: SalaryDeductionRule): 'percent' | 'fixed' {
    if (rule.type === 'percent' || rule.type === 'fixed') {
        return rule.type;
    }

    return (rule.fixed_amount ?? 0) > 0 ? 'fixed' : 'percent';
}

export function normalizeSalaryDeductionRules(
    rules: SalaryDeductionRule[],
): SalaryDeductionRule[] {
    return rules.map((rule) => {
        const type = resolveRuleType(rule);

        return {
            name: rule.name ?? '',
            type,
            percent: type === 'percent' ? Number(rule.percent ?? 0) : 0,
            fixed_amount: type === 'fixed' ? Number(rule.fixed_amount ?? 0) : 0,
        };
    });
}

export function createPercentDeductionRule(): SalaryDeductionRule {
    return {
        name: '',
        type: 'percent',
        percent: 0,
        fixed_amount: 0,
    };
}

export function calculateDeductionAmount(
    gross: number,
    rule: SalaryDeductionRule,
): number {
    const type = resolveRuleType(rule);

    if (type === 'fixed') {
        return Math.max(0, Number(rule.fixed_amount ?? 0));
    }

    return Math.max(0, gross * (Number(rule.percent ?? 0) / 100));
}

export function calculateExpectedNetFromRules(
    gross: number,
    rules: SalaryDeductionRule[],
): number {
    const totalDeduction = normalizeSalaryDeductionRules(rules).reduce(
        (sum, rule) => sum + calculateDeductionAmount(gross, rule),
        0,
    );

    return Number(Math.max(0, gross - totalDeduction).toFixed(2));
}
