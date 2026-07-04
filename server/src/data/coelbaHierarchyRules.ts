export const COELBA_COMPANY_ID = "coelba";
export const COELBA_TECHNICAL_SUPERINTENDENCE_ID = "sup-tecnica-coelba";
export const COELBA_TECHNICAL_SUPERINTENDENCE_NAME = "Superintendencia Tecnica Coelba";
export const COELBA_CORPORATE_SUPERINTENDENCE_ID = "sup-corporativas-coelba";
export const COELBA_CORPORATE_SUPERINTENDENCE_NAME = "superintendencias corporativas";
export const COELBA_UTD_SUPERINTENDENCE_ID = "sup-utds-coelba";
export const COELBA_UTD_MANAGEMENT_ID = "mgmt-utd-atributos";

export const COELBA_LEGACY_OPERATION_SUPERINTENDENCE_IDS = [
  "sup-operacoes-ba",
  "sup-operacao-metropolitano-sul",
  "sup-operacao-sudoeste-oeste",
] as const;

const normalize = (value?: string | null): string =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const normalizeCompact = (value?: string | null): string => normalize(value).replace(/[^a-z0-9]+/g, "");
const approvalTitles = new Set(["Gestor", "Gerente", "Superintendente", "Diretor"]);

export const isCoelbaCompanyId = (value?: string | null): boolean => value === COELBA_COMPANY_ID;

export const isCoelbaCorporateSuperintendenceId = (value?: string | null): boolean =>
  value === COELBA_CORPORATE_SUPERINTENDENCE_ID;

export const isCoelbaUtdSuperintendenceId = (value?: string | null): boolean =>
  value === COELBA_UTD_SUPERINTENDENCE_ID;

export const isCoelbaUtdManagementId = (value?: string | null): boolean =>
  value === COELBA_UTD_MANAGEMENT_ID;

export const isCoelbaUtdHierarchy = (input: {
  companyId?: string | null;
  superintendenceId?: string | null;
  managementId?: string | null;
}): boolean =>
  isCoelbaCompanyId(input.companyId) &&
  isCoelbaUtdSuperintendenceId(input.superintendenceId) &&
  isCoelbaUtdManagementId(input.managementId);

export const isCoelbaLegacyOperationSuperintendenceId = (value?: string | null): boolean =>
  COELBA_LEGACY_OPERATION_SUPERINTENDENCE_IDS.includes(
    value as (typeof COELBA_LEGACY_OPERATION_SUPERINTENDENCE_IDS)[number]
  );

export const isCorporateSuperintendenceName = (value?: string | null): boolean =>
  normalizeCompact(value) === normalizeCompact(COELBA_CORPORATE_SUPERINTENDENCE_NAME);

export const isLegacyOperationSuperintendenceName = (value?: string | null): boolean => {
  const normalized = normalize(value);
  if (!normalized) return false;
  if (
    normalized.includes("operacao centro norte") ||
    normalized.includes("operacao metropolitano sul") ||
    normalized.includes("operacao sudoeste oeste")
  ) {
    return true;
  }

  const operacoesIndex = normalized.indexOf("operacoes");
  const operacaoIndex = normalized.indexOf("operacao");
  const matchIndex = operacoesIndex >= 0 ? operacoesIndex : operacaoIndex;
  if (matchIndex < 0) return false;

  const suffix = normalized.slice(matchIndex).replace(/^operacoes?|^de operacoes?/, "").trim();
  return suffix.length > 0;
};

export const isLegacyOperationSuperintendence = (input: {
  companyId?: string | null;
  superintendenceId?: string | null;
  superintendenceName?: string | null;
}): boolean =>
  isCoelbaCompanyId(input.companyId) &&
  (isCoelbaLegacyOperationSuperintendenceId(input.superintendenceId) ||
    isLegacyOperationSuperintendenceName(input.superintendenceName));

export const normalizeCoelbaHierarchy = <T extends {
  companyId?: string | null;
  companyName?: string | null;
  superintendenceId?: string | null;
  superintendenceName?: string | null;
  managementId?: string | null;
  managementName?: string | null;
  projectId?: string | null;
  projectName?: string | null;
}>(input: T): T => {
  if (!isLegacyOperationSuperintendence(input)) {
    if (isCoelbaCompanyId(input.companyId) && isCoelbaCorporateSuperintendenceId(input.superintendenceId)) {
      return {
        ...input,
        managementId: input.managementId ?? null,
        managementName: input.managementName ?? null,
        projectId: input.projectId ?? null,
        projectName: input.projectName ?? null,
      };
    }
    return input;
  }

  return {
    ...input,
    superintendenceId: COELBA_TECHNICAL_SUPERINTENDENCE_ID,
    superintendenceName: COELBA_TECHNICAL_SUPERINTENDENCE_NAME,
  };
};

export const clearCorporateHierarchyChildren = <T extends {
  superintendenceId?: string | null;
  superintendenceName?: string | null;
  managementId?: string | null;
  managementName?: string | null;
  projectId?: string | null;
  projectName?: string | null;
}>(input: T): T => {
  if (
    !isCoelbaCorporateSuperintendenceId(input.superintendenceId) &&
    !isCorporateSuperintendenceName(input.superintendenceName)
  ) {
    return input;
  }

  return {
    ...input,
    managementId: null,
    managementName: null,
    projectId: null,
    projectName: null,
  };
};

export const shouldHideCoelbaSuperintendenceFromActiveOptions = (input: {
  companyId?: string | null;
  superintendenceId?: string | null;
  superintendenceName?: string | null;
}): boolean => isLegacyOperationSuperintendence(input);

export const isCentralCorporateApprover = (user?: {
  company_id?: string | null;
  superintendence_id?: string | null;
  job_title?: string | null;
  roles?: string[];
} | null): boolean =>
  Boolean(
    user &&
      isCoelbaCompanyId(user.company_id) &&
      isCoelbaCorporateSuperintendenceId(user.superintendence_id) &&
      approvalTitles.has(user.job_title ?? "")
  );
