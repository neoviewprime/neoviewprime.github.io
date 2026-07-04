export const COELBA_COMPANY_ID = 'coelba';
export const COELBA_COMPANY_NAME = 'Neoenergia Coelba';
export const COELBA_STRUCTURE_STAGE_LABEL = 'Estrutura Coelba';
export const COELBA_AREA_CENTRAL_FLOW_ID = 'area-central';
export const COELBA_AREA_CENTRAL_FLOW_LABEL = '\u00c1rea Central';
export const COELBA_UTD_FLOW_ID = 'utds';
export const COELBA_UTD_SUPERINTENDENCE_ID = 'sup-utds-coelba';
export const COELBA_UTD_SUPERINTENDENCE_NAME = "UTD's";
export const COELBA_UTD_MANAGEMENT_ID = 'mgmt-utd-atributos';
export const COELBA_UTD_MANAGEMENT_NAME = 'Atributos';
export const COELBA_CORPORATE_SUPERINTENDENCE_ID = 'sup-corporativas-coelba';
export const COELBA_CORPORATE_SUPERINTENDENCE_NAME = 'superintend\u00eancias corporativas';
export const COELBA_LEGACY_OPERATION_SUPERINTENDENCE_IDS = [
  'sup-operacoes-ba',
  'sup-operacao-metropolitano-sul',
  'sup-operacao-sudoeste-oeste'
] as const;

export const COELBA_UTD_ATTRIBUTES = [
  {
    id: 'utd-financeiro',
    name: 'Financeiro',
    description: 'Acompanhe relat\u00f3rios e indicadores financeiros consolidados da Coelba.'
  },
  {
    id: 'utd-seguranca',
    name: 'Seguran\u00e7a',
    description: 'Concentre evid\u00eancias, an\u00e1lises e relat\u00f3rios de seguran\u00e7a operacional.'
  },
  {
    id: 'utd-qualidade',
    name: 'Qualidade',
    description: 'Organize relat\u00f3rios de qualidade, conformidade e melhoria cont\u00ednua.'
  },
  {
    id: 'utd-receita',
    name: 'Receita',
    description: 'Re\u00fana materiais ligados a receita, perdas e desempenho comercial.'
  },
  {
    id: 'utd-clientes',
    name: 'Clientes',
    description: 'Centralize os relat\u00f3rios voltados \u00e0 experi\u00eancia e ao relacionamento com clientes.'
  },
  {
    id: 'utd-transgressoes',
    name: 'Transgress\u00f5es',
    description: 'Acompanhe transgress\u00f5es, desvios e a\u00e7\u00f5es corretivas em um \u00fanico fluxo.'
  },
  {
    id: 'utd-excelencia-operacional',
    name: 'Excel\u00eancia Operacional',
    description: 'Monitore iniciativas e resultados ligados \u00e0 excel\u00eancia operacional.'
  }
] as const;

export const COELBA_ENTRY_FLOWS = [
  {
    id: COELBA_AREA_CENTRAL_FLOW_ID,
    title: COELBA_AREA_CENTRAL_FLOW_LABEL,
    description: 'Acesse a estrutura principal da Coelba para navegar pelas \u00e1reas centrais ativas.'
  },
  {
    id: COELBA_UTD_FLOW_ID,
    title: "UTD's",
    description: 'Acesse a vis\u00e3o por atributos para acompanhar indicadores e relat\u00f3rios em um fluxo dedicado.'
  }
] as const;

export const isCoelbaCompanyId = (value?: string | null): boolean => value === COELBA_COMPANY_ID;

export const isCoelbaUtdSuperintendenceId = (value?: string | null): boolean =>
  value === COELBA_UTD_SUPERINTENDENCE_ID;

export const isCoelbaUtdManagementId = (value?: string | null): boolean =>
  value === COELBA_UTD_MANAGEMENT_ID;

export const isCoelbaCorporateSuperintendenceId = (value?: string | null): boolean =>
  value === COELBA_CORPORATE_SUPERINTENDENCE_ID;

export const isCoelbaLegacyOperationSuperintendenceId = (value?: string | null): boolean =>
  COELBA_LEGACY_OPERATION_SUPERINTENDENCE_IDS.includes(
    value as (typeof COELBA_LEGACY_OPERATION_SUPERINTENDENCE_IDS)[number]
  );

export const isCoelbaUtdPath = (input: {
  companyId?: string | null;
  superintendenceId?: string | null;
  managementId?: string | null;
}): boolean =>
  isCoelbaCompanyId(input.companyId) &&
  isCoelbaUtdSuperintendenceId(input.superintendenceId) &&
  isCoelbaUtdManagementId(input.managementId);

export const getCoelbaUtdAttributeById = (projectId?: string | null) =>
  COELBA_UTD_ATTRIBUTES.find((item) => item.id === projectId) ?? null;
