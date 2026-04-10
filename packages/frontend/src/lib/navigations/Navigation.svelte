<script lang="ts">
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { SettingsNavItem } from '@podman-desktop/ui-svelte';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import ImageIcon from '$lib/icons/ImageIcon.svelte';
</script>

<nav
  class="z-1 w-leftsidebar min-w-leftsidebar flex-col justify-between flex transition-all duration-500 ease-in-out bg-[var(--pd-secondary-nav-bg)] border-[var(--pd-global-nav-bg-border)] border-r-[1px]"
  aria-label="Navigation">
  <div class="flex items-center">
    <a href={resolve('/')} title="Navigate to dashboard" class="pt-4 px-3 mb-5 flex items-center gap-3">
      <p
        class="text-xl font-semibold text-[color:var(--pd-secondary-nav-header-text)] border-l-[4px] border-transparent">
        Hummingbird
      </p>
    </a>
  </div>
  <div class="h-full overflow-y-auto" style="margin-bottom:auto">
    <!-- FontAwesome icons rendered via SettingsNavItem are slightly narrower than custom Svelte component icons
             (which get wrapped in a <span> by the Icon component). The pl-[1px] compensates for this alignment difference. -->
    <div class="pl-[1px]">
      <SettingsNavItem title="Catalog" icon={faHouse} selected={page.url.pathname === '/'} href={resolve('/')} />
    </div>

    <SettingsNavItem
      title="Alternatives"
      icon={ImageIcon}
      selected={page.url.pathname === '/alternatives'}
      href={resolve('/alternatives')} />
  </div>
</nav>
