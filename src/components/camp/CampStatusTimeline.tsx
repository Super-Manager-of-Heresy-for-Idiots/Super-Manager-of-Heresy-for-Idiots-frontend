import { Fragment } from 'react';
import type { CSSProperties } from 'react';
import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import type { CampStatus } from '@/types';
import s from './CampStatusTimeline.module.css';

/** Основная цепочка привала; INTERRUPTED — боковая ветка, а не шаг. */
const CHAIN: CampStatus[] = ['SETTING_UP', 'ACTIVE', 'RESTING', 'COMPLETED'];

interface CampStatusTimelineProps {
  status: CampStatus;
  /** Пройденные статусы с сервера — прерванный привал всё равно показывает свой путь. */
  visited: CampStatus[];
}

export function CampStatusTimeline({ status, visited }: CampStatusTimelineProps) {
  const t = useT();
  const interrupted = status === 'INTERRUPTED';
  const currentIndex = CHAIN.indexOf(status);
  const reached = interrupted
    ? Math.max(...visited.map((v) => CHAIN.indexOf(v)).filter((i) => i >= 0), 0)
    : Math.max(currentIndex, 0);

  return (
    <div className={s.wrap}>
      <div className={s.chain}>
        {CHAIN.map((step, index) => {
          const done = index < reached;
          const current = !interrupted && index === currentIndex;
          const tone = current
            ? 'var(--gold)'
            : done
              ? 'var(--bronze-warm)'
              : 'var(--ink-ghost)';

          return (
            <Fragment key={step}>
              {index > 0 && (
                <span className={`${s.link} ${index <= reached ? s.linkDone : ''}`} />
              )}
              <span className={s.node}>
                <span className={s.nodeMark}>
                  <Rune
                    kind={current || done ? 'diamond-fill' : 'diamond'}
                    size={current ? 16 : 11}
                    color={tone}
                  />
                  {current && <span className={s.halo} style={{ '--tone': tone } as CSSProperties} />}
                </span>
                <span className={`${s.nodeLabel} ${current ? s.nodeLabelCurrent : done ? s.nodeLabelDone : ''}`}>
                  {t(`campfire.statusShort.${step}`)}
                </span>
              </span>
            </Fragment>
          );
        })}
      </div>

      <div className={`${s.branch} ${interrupted ? s.branchActive : ''}`}>
        <span className={s.branchStem} />
        <span className={s.branchLine} />
        <Rune kind="diamond" size={10} color={interrupted ? 'var(--ember)' : 'var(--ink-ghost)'} />
        <span className={s.branchLabel}>{t('campfire.statusShort.INTERRUPTED')}</span>
      </div>
    </div>
  );
}
