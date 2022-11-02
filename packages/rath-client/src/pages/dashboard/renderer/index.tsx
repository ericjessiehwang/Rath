import useId from '@material-ui/core/utils/useId';
import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';
import styled, { StyledComponentProps } from 'styled-components';
import { DashboardDocument } from '../../../store/dashboardStore';
import Card, { CardProps } from './card';
import { scaleRatio } from './constant';


export const transformCoord = (target: HTMLElement, ev: { clientX: number; clientY: number }, w: number, h: number, ratio: number) => {
    const { x, y } = target.getBoundingClientRect();

    return {
        x: Math.max(0, Math.min(Math.round((ev.clientX - x) / ratio), w)),
        y: Math.max(0, Math.min(Math.round((ev.clientY - y) / ratio), h)),
    };
};

const Draft = styled.div`
    background-color: #fff;
    border-radius: 2px;
    margin: 16px;
    box-shadow:
        0 1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 0.3px 0.9px 0 rgb(0 0 0 / 11%),
        0 -1.6px 3.6px 0 rgb(0 0 0 / 13%), 0 -0.3px 0.9px 0 rgb(0 0 0 / 11%);
    background-repeat: repeat;
    background-position: 0 0;
    position: relative;
    cursor: crosshair;
`;

export type DashboardRendererProps = StyledComponentProps<'div', {}, {
    page: DashboardDocument;
    editor?: (index: number) => CardProps['editor'];
    renderRatio?: number;
}, never>;

const DashboardRenderer = forwardRef<HTMLDivElement, DashboardRendererProps>(function DashboardRenderer ({ page, editor, renderRatio = scaleRatio, ...props }, ref) {
    const id = useId();

    return (
        <Draft
            ref={ref}
            id={id}
            {...props}
            style={{
                ...props.style,
                width: `${page.config.size.w * renderRatio}px`,
                height: `${page.config.size.h * renderRatio}px`,
            }}
        >
            {page.cards.map((card, i) => (
                <Card
                    key={i}
                    ratio={renderRatio}
                    globalFilters={page.config.filters}
                    card={card}
                    cards={page.cards}
                    index={i}
                    editor={editor?.(i)}
                    transformCoord={ev => {
                        const parent = id ? document.getElementById(id) : null;
                        if (parent) {
                            return transformCoord(parent, ev, page.config.size.w, page.config.size.h, renderRatio);
                        }
                        return { x: NaN, y: NaN };
                    }}
                />
            ))}
            {props.children}
        </Draft>
    );
});

export default observer(DashboardRenderer);
