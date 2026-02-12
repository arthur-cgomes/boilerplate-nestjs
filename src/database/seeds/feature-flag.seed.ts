import { DataSource } from 'typeorm';
import { FeatureFlag } from '../../feature-flag/entity/feature-flag.entity';

export const seedFeatureFlags = async (
  dataSource: DataSource,
): Promise<void> => {
  const featureFlagRepository = dataSource.getRepository(FeatureFlag);

  const defaultFlags = [
    {
      key: 'dark_mode',
      name: 'Modo Escuro',
      description: 'Habilita o tema escuro na interface',
      enabled: true,
      rolloutPercentage: 100,
      allowedEnvironments: ['local', 'development', 'production'],
    },
    {
      key: 'new_dashboard',
      name: 'Novo Dashboard',
      description: 'Nova versão do dashboard com métricas atualizadas',
      enabled: false,
      rolloutPercentage: 50,
      allowedUserTypes: ['admin', 'global'],
      allowedEnvironments: ['local', 'development'],
    },
    {
      key: 'file_upload_v2',
      name: 'Upload de Arquivos V2',
      description: 'Nova versão do sistema de upload com compressão automática',
      enabled: true,
      rolloutPercentage: 100,
      allowedEnvironments: ['local', 'development', 'production'],
    },
    {
      key: 'audit_log_export',
      name: 'Exportação de Audit Log',
      description: 'Permite exportar logs de auditoria em CSV/Excel',
      enabled: false,
      rolloutPercentage: 100,
      allowedUserTypes: ['admin'],
      allowedEnvironments: ['local', 'development'],
    },
  ];

  for (const flagData of defaultFlags) {
    const existingFlag = await featureFlagRepository.findOne({
      where: { key: flagData.key },
    });

    if (!existingFlag) {
      const flag = featureFlagRepository.create(flagData);
      await featureFlagRepository.save(flag);
      console.log(`Feature flag '${flagData.key}' created successfully`);
    } else {
      console.log(`Feature flag '${flagData.key}' already exists`);
    }
  }
};
