<script lang="ts">
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { SettingsNavItem } from '@podman-desktop/ui-svelte';
import { resolve, asset } from '$app/paths';
import { page } from '$app/state';
import ImageIcon from '#lib/icons/ImageIcon.svelte';
</script>

<nav
  class="z-1 w-leftsidebar min-w-leftsidebar flex-col justify-between flex transition-all duration-500 ease-in-out bg-[var(--pd-secondary-nav-bg)] border-[var(--pd-global-nav-bg-border)] border-r-[1px]"
  aria-label="Navigation">
  <div class="flex items-center">
    <a href={resolve('/')} title="Navigate to dashboard" class="pt-4 px-3 mb-5 flex items-center gap-1">
      <img src={asset('icon.png')} alt="Hummingbird" class="w-6 h-6" />
      <p
        class="text-xl font-semibold text-[color:var(--pd-secondary-nav-header-text)] border-l-[4px] border-transparent">
        Hummingbird
      </p>
    </a>
  </div>

  <div class="h-full overflow-y-auto [&_svg]:w-[1.25em] [&_span[role=img]]:w-[1.25em]" style="margin-bottom:auto">
    <SettingsNavItem title="Catalog" icon={faHouse} selected={page.url.pathname === '/'} href={resolve('/')} />

    <SettingsNavItem
      title="Alternatives"
      icon={ImageIcon}
      selected={page.url.pathname === '/alternatives'}
      href={resolve('alternatives')} />
  </div>
</nav>
