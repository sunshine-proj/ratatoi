import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { formatMessage, getMessages } from "@/lib/i18n";
import { formatNumber } from "@/lib/i18n/format";
import { MIN_SUGGESTED_KCAL, PROTEIN_MAX_ENERGY_SHARE, type Estimate } from "@/lib/nutrition/estimate";

/** Shows an estimate with the full working, so it never looks like a prescription. */
export function EstimateResult({ estimate, headingId, action }: {
  estimate: Estimate;
  headingId: string;
  action?: React.ReactNode;
}) {
  const t = getMessages();
  const percent = Math.round(Math.abs(estimate.energyAdjustment) * 100);
  const adjustment =
    estimate.energyAdjustment < 0
      ? formatMessage(t.estimate.adjustmentLoss, { percent })
      : estimate.energyAdjustment > 0
        ? formatMessage(t.estimate.adjustmentGain, { percent })
        : t.estimate.adjustmentNone;

  return (
    <Card as="section" aria-labelledby={headingId} className="flex flex-col gap-4">
      <h3 id={headingId} className="text-xl font-semibold">
        {t.estimate.title}
      </h3>
      <p className="flex flex-wrap gap-2">
        <Tag tone="energy" className="text-base">
          {formatMessage(t.estimate.calories, { kcal: formatNumber(estimate.calories) })}
        </Tag>
        <Tag tone="protein" className="text-base">
          {formatMessage(t.estimate.protein, { g: formatNumber(estimate.protein) })}
        </Tag>
      </p>
      <div>
        <h4 className="font-medium">{t.estimate.methodTitle}</h4>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-muted">
          <li>{formatMessage(t.estimate.resting, { kcal: formatNumber(estimate.restingKcal) })}</li>
          <li>{formatMessage(t.estimate.maintenance, { kcal: formatNumber(estimate.maintenanceKcal) })}</li>
          <li>{adjustment}</li>
          {estimate.flooredAtMinimum ? (
            <li>{formatMessage(t.estimate.floored, { kcal: formatNumber(MIN_SUGGESTED_KCAL) })}</li>
          ) : null}
          <li>{formatMessage(t.estimate.proteinRule, { perKg: formatNumber(estimate.proteinGPerKg, undefined, 1) })}</li>
          {estimate.proteinCapped ? (
            <li>{formatMessage(t.estimate.proteinCapped, { percent: Math.round(PROTEIN_MAX_ENERGY_SHARE * 100) })}</li>
          ) : null}
        </ul>
      </div>
      <p className="text-sm">{t.estimate.note}</p>
      {action}
    </Card>
  );
}
