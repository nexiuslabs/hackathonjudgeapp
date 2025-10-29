import { type ComponentPropsWithoutRef, type ElementType } from 'react';

import { cn } from '@/lib/utils';

type Inset = 'top' | 'bottom' | 'inline';

const insetClassMap: Record<Inset, string> = {
  top: 'safe-area-top',
  bottom: 'safe-area-bottom',
  inline: 'safe-area-inline',
};

export type SafeAreaContainerProps<T extends ElementType> = {
  as?: T;
  insets?: Inset[];
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>;

const defaultInsets: Inset[] = ['inline'];

export function SafeAreaContainer<T extends ElementType = 'div'>(
  props: SafeAreaContainerProps<T>,
) {
  const { as, insets = defaultInsets, className, ...rest } = props;
  const Component = (as ?? 'div') as ElementType;
  const insetClasses = insets.map((inset) => insetClassMap[inset]);

  return (
    <Component className={cn(...insetClasses, className)} {...rest} />
  );
}
