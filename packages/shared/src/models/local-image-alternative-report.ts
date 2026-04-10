import type { VulnerabilitiesSummary } from '../generated/hummingbird-project';

export interface LocalImageAlternativeReport {
  localImage: {
    vulnerabilities: VulnerabilitiesSummary;
    size: number;
  };
  alternative: {
    vulnerabilities: VulnerabilitiesSummary;
    size: number;
  };
}
