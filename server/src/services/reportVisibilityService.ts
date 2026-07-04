type UserLike = {
  id?: string;
  company_id?: string;
  company_name?: string;
  superintendence_id?: string;
  superintendence_name?: string;
  management_id?: string;
  management_name?: string;
  project_id?: string;
  project_name?: string;
  roles?: string[];
};

const COELBA_COMPANY_ID = "coelba";
const COELBA_UTD_SUPERINTENDENCE_ID = "sup-utds-coelba";
const COELBA_UTD_MANAGEMENT_ID = "mgmt-utd-atributos";

type HierarchyLike = {
  companyId?: string | null;
  companyName?: string | null;
  superintendenceId?: string | null;
  superintendenceName?: string | null;
  managementId?: string | null;
  managementName?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  submittedBy?: string | null;
};

const normalize = (value?: string | null): string => String(value ?? "").trim();
const normalizeName = (value?: string | null): string =>
  normalize(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const userHasGlobalCatalogAccess = (user?: UserLike | null): boolean =>
  Boolean(user?.roles?.includes("admin") || user?.roles?.includes("superadmin"));

export const canUserAccessHierarchy = (user: UserLike | null | undefined, input: HierarchyLike): boolean => {
  if (!user) return false;
  if (userHasGlobalCatalogAccess(user)) return true;

  const userId = normalize(user.id);
  const submittedBy = normalize(input.submittedBy);
  if (userId && submittedBy && userId === submittedBy) return true;

  const companyId = normalize(input.companyId);
  const companyName = normalizeName(input.companyName);
  const superintendenceId = normalize(input.superintendenceId);
  const superintendenceName = normalizeName(input.superintendenceName);
  const managementId = normalize(input.managementId);
  const managementName = normalizeName(input.managementName);
  const projectId = normalize(input.projectId);
  const projectName = normalizeName(input.projectName);

  const userCompanyId = normalize(user.company_id);
  const userCompanyName = normalizeName(user.company_name);
  if (companyId) {
    if (userCompanyId !== companyId) return false;
  } else if (companyName) {
    if (!userCompanyName || userCompanyName !== companyName) return false;
  } else {
    return false;
  }

  const isCoelbaCompanyWideUtdPath =
    companyId === COELBA_COMPANY_ID &&
    superintendenceId === COELBA_UTD_SUPERINTENDENCE_ID &&
    managementId === COELBA_UTD_MANAGEMENT_ID;

  if (isCoelbaCompanyWideUtdPath) {
    return true;
  }

  const userSuperintendenceId = normalize(user.superintendence_id);
  const userSuperintendenceName = normalizeName(user.superintendence_name);
  if (userSuperintendenceId) {
    if (userSuperintendenceId !== superintendenceId) return false;
  } else if (userSuperintendenceName && superintendenceName && userSuperintendenceName !== superintendenceName) {
    return false;
  }

  const userManagementId = normalize(user.management_id);
  const userManagementName = normalizeName(user.management_name);
  if (userManagementId) {
    if (userManagementId !== managementId) return false;
  } else if (userManagementName && managementName && userManagementName !== managementName) {
    return false;
  }

  const userProjectId = normalize(user.project_id);
  const userProjectName = normalizeName(user.project_name);
  if (userProjectId) {
    if (userProjectId !== projectId) return false;
  } else if (userProjectName && projectName && userProjectName !== projectName) {
    return false;
  }

  return true;
};
