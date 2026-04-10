import type { VulnerabilitiesSummary } from '../generated/hummingbird-project';

export interface LocalImageAlternativeReport {
  localImage: {
    vulnerabilities: VulnerabilitiesSummary;
  };
  alternative: {
    vulnerabilities: VulnerabilitiesSummary;
  };
}
