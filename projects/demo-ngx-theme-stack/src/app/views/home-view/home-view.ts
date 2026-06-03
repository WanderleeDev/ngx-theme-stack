import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceHeaderComponent } from '../../components/service-header/service-header';

@Component({
  selector: 'app-home-view',
  standalone: true,
  imports: [RouterLink, ServiceHeaderComponent],
  host: {
    class: 'w-full flex items-center justify-center px-4 md:px-6',
  },
  template: `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-4xl">
      <app-service-header
        title="NGX-theme-stack"
        description="Powerful theme management for Angular — SSR safe, signal-driven, zero-flicker."
        [tags]="tags"
      />

      <div
        class="rounded-3xl bg-card-bg backdrop-blur-xl border border-card-border p-6 flex flex-col justify-between min-h-[220px]"
      >
        <div class="w-full">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-white/5 border border-white/10"
          >
            <span class="material-symbols-outlined text-xl text-[var(--accent)]"> terminal </span>
          </div>
          <h2 class="text-lg font-black font-outfit tracking-tight mb-1">Installation</h2>
          <p class="text-[11px] text-text-muted/70 font-inter leading-relaxed">
            Add the package to your workspace with a single command.
          </p>

          <button
            (click)="copyCommand()"
            class="w-full bg-tag-bg border border-card-border font-mono text-[10px] rounded-xl p-3 flex items-center justify-between text-text-main mt-3 cursor-pointer hover:border-[var(--primary)]/45 hover:bg-tag-bg/85 transition-all duration-300 select-all active:scale-98 group/btn"
          >
            <span class="text-left select-all">ng add ngx-theme-stack</span>
            <span
              class="material-symbols-outlined text-xs group-hover/btn:text-[var(--primary)] transition-colors select-none"
            >
              {{ copied() ? 'check' : 'content_copy' }}
            </span>
          </button>
        </div>
      </div>

      @for (service of services; track service.id) {
        <a
          [routerLink]="service.path"
          class="group/card relative overflow-hidden rounded-3xl bg-card-bg backdrop-blur-xl border border-card-border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] flex flex-col justify-between min-h-[220px] animate-zoom-in animate-duration-500"
          [style.animation-delay.ms]="$index * 200"
        >
          <div
            class="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
            [style.background]="service.color"
          ></div>
          <div class="relative z-10">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover/card:scale-110"
              [style.background-color]="service.color + '1a'"
            >
              <span class="material-symbols-outlined text-xl" [style.color]="service.color">
                {{ service.icon }}
              </span>
            </div>
            <h2 class="text-lg font-black font-outfit tracking-tight mb-1">
              {{ service.label }}
            </h2>
            <p class="text-xs text-text-muted/70 font-inter leading-relaxed">
              {{ service.description }}
            </p>
          </div>
          <span
            class="relative material-symbols-outlined text-sm opacity-0 -translate-x-1 group-hover/card:opacity-50 group-hover/card:translate-x-0 transition-all duration-300 self-end mt-4 z-10"
            >arrow_forward</span
          >
        </a>
      }

      <div
        class="md:col-span-3 rounded-2xl bg-card-bg backdrop-blur-xl border border-card-border px-6 py-3 flex items-center justify-between"
      >
        <span
          class="text-[10px] uppercase tracking-[0.3em] text-text-muted/50 font-black font-outfit"
        >
          Interactive Demo
        </span>
        <div class="flex items-center gap-3">
          @for (service of services; track service.id) {
            <a
              [routerLink]="service.path"
              class="w-2 h-2 rounded-full transition-all duration-300 hover:scale-150"
              [style.background-color]="service.color"
              [attr.aria-label]="service.label + ' demo'"
            ></a>
          }
        </div>
      </div>
    </div>
  `,
})
export default class HomeView {
  protected readonly tags = ['Angular 20+', 'SSR Ready', 'Signals', 'Zero Flicker'];
  protected copied = signal(false);

  protected copyCommand() {
    if (this.copied()) return;
    navigator.clipboard.writeText('ng add ngx-theme-stack');
    this.copied.set(true);
    setTimeout(() => {
      this.copied.set(false);
    }, 2000);
  }

  protected readonly services = [
    {
      id: 'toggle',
      path: '/toggle',
      label: 'Toggle',
      icon: 'toggle_on',
      color: 'var(--primary)',
      description: 'Binary switching between two themes with a single action.',
    },
    {
      id: 'cycle',
      path: '/cycle',
      label: 'Cycle',
      icon: 'sync',
      color: 'var(--accent)',
      description: 'Step through your full theme list sequentially.',
    },
    {
      id: 'select',
      path: '/select',
      label: 'Select',
      icon: 'checklist',
      color: 'var(--info)',
      description: 'Pick any theme directly from available options.',
    },
  ];
}
