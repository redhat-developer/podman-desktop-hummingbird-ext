<script lang="ts">
import type { PageProps } from './$types';
import OptimisationReport from '$lib/report/OptimisationReport.svelte';
import VulnerabilityChart from '$lib/report/VulnerabilityChart.svelte';

let { data }: PageProps = $props();


</script>

<h2>{data.engineId}</h2>

{#await data.report}
    <span>Loading...</span>
{:then report}

    <div class="mx-5">

        {#if report.alternative?.vulnerabilities && report.vulnerabilities}
            <div class="bg-(--pd-content-card-bg)">
                <h1 class="text-xl font-bold capitalize text-(--pd-content-header)">Vulnerabilities</h1>
                <div class="max-w-4/5">
                    <VulnerabilityChart
                            alt={report.alternative.vulnerabilities.summary}
                            image={report.vulnerabilities}
                    />
                </div>
            </div>
        {/if}

    </div>

    <div class="flex flex-col gap-x-2">

        {#if report.alternative?.vulnerabilities && report.vulnerabilities}

        {/if}

        <div class="bg-(--pd-content-card-bg)">
            <OptimisationReport object={report} />
        </div>

        {#if report.alternative}
            <div class="bg-(--pd-content-card-bg)">
                <strong>Alternative</strong>
                <ul>
                    <li>name: {report.alternative.image.name}</li>
                    <li>{report.alternative.image.name}</li>
                </ul>

                {#if report.alternative.sbom}
                    <strong>sbom</strong>
                    <ul>
                        <li>runtime_count: {report.alternative.sbom.runtime_count} (from syft)</li>
                        <li>build_count: {report.alternative.sbom.build_count}</li>
                        <li>source_count: {report.alternative.sbom.source_count}</li>
                    </ul>
                {/if}

                {#if report.alternative.vulnerabilities}
                    <strong>vulnerabilities</strong>
                    <ul>
                        <li>scanner: {report.alternative.vulnerabilities.scanner}</li>
                        <li>scanned_at: {report.alternative.vulnerabilities.scanned_at}</li>
                        <li>summary#low: {report.alternative.vulnerabilities.summary.low}</li>
                        <li>summary#medium: {report.alternative.vulnerabilities.summary.medium}</li>
                        <li>summary#high: {report.alternative.vulnerabilities.summary.high}</li>
                        <li>summary#critical: {report.alternative.vulnerabilities.summary.critical}</li>
                        <li>summary#negligible: {report.alternative.vulnerabilities.summary.negligible}</li>
                    </ul>
                {/if}
            </div>
        {/if}

        <div class="bg-(--pd-content-card-bg)">
            <strong>Image inspect</strong>
            <ul>
                {#if report.sbom}
                    <li>packages#count: {report.sbom.count} (from syft)</li>
                {/if}
                {#if report.inspect}
                    <li>inspect#size: {report.inspect.size}</li>
                {/if}
                {#if report.vulnerabilities}
                    <strong>vulnerabilities</strong>
                    <ul>
                        <li>summary#low: {report.vulnerabilities.low}</li>
                        <li>summary#medium: {report.vulnerabilities.medium}</li>
                        <li>summary#high: {report.vulnerabilities.high}</li>
                        <li>summary#critical: {report.vulnerabilities.critical}</li>
                        <li>summary#negligible: {report.vulnerabilities.negligible}</li>
                    </ul>
                {/if}
            </ul>
        </div>
    </div>
{/await}
