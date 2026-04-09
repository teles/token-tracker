export const supportedAppLanguages = ['en-US', 'pt-BR'] as const;

export type AppLanguage = (typeof supportedAppLanguages)[number];

export interface AppLanguageDescriptor {
  value: AppLanguage;
  optionLabelKey: string;
  badgeLabelKey: string;
}

export const appLanguageDescriptors: AppLanguageDescriptor[] = [
  {
    value: 'pt-BR',
    optionLabelKey: 'settings.option.ptBr',
    badgeLabelKey: 'header.languageBadge.ptBr'
  },
  {
    value: 'en-US',
    optionLabelKey: 'settings.option.enUs',
    badgeLabelKey: 'header.languageBadge.enUs'
  }
];

export const appLanguageDescriptorByValue: Record<AppLanguage, AppLanguageDescriptor> =
  appLanguageDescriptors.reduce((accumulator, descriptor) => {
    accumulator[descriptor.value] = descriptor;
    return accumulator;
  }, {} as Record<AppLanguage, AppLanguageDescriptor>);
