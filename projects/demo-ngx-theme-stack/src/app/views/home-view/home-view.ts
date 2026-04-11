import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-view',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div
      class="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-in fade-in duration-1000"
    >
      <!-- Theme-Reactive Title -->
      <h1
        class="text-5xl md:text-8xl font-black tracking-tighter title-reactive-gradient drop-shadow-sm font-outfit mb-10 select-none "
      >
        <span class="uppercase">ngx</span>-theme-stack
      </h1>

      <p
        class="text-xl md:text-2xl text-fg/60 leading-relaxed font-medium font-inter max-w-2xl mx-auto mb-16"
      >
        Experience the power of a streamlined theme management workflow through our specialized
        suite of services.
      </p>

      <!-- Minimalist Section Header -->
      <div class="w-full max-w-4xl mb-6 text-left">
        <h2
          class="text-[10px] uppercase tracking-[0.4em] text-primary/60 font-black font-outfit border-b border-primary/10 pb-2 inline-block"
        >
          Interactive Utility Services Demo
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        @for (service of services; track service.id) {
          <a
            [routerLink]="service.path"
            class="group/card p-6 md:p-8 rounded-[2rem] bg-card-bg border border-white/5 shadow-xl transition-all hover:border-primary/50 hover:-translate-y-1 cursor-pointer block text-left"
          >
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors"
              [style.background-color]="service.color + '1a'"
            >
              <span
                class="material-icons text-3xl transform transition-transform group-hover/card:scale-110"
                [style.color]="service.color"
              >
                {{ service.icon }}
              </span>
            </div>
            <h3 class="text-xl font-black mb-2 font-outfit capitalize tracking-tight">
              {{ service.label }}
            </h3>
            <p class="text-xs opacity-50 font-inter leading-relaxed">{{ service.description }}</p>
          </a>
        }
      </div>
    </div>
  `,
  styles: `
    .title-reactive-gradient {
      background: linear-gradient(
        to right,
        var(--primary, oklch(0.7 0.2 250)),
        var(--accent, oklch(0.6 0.25 320))
      );
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      transition: all 1s ease-in-out;
    }
  `,
})
export default class HomeView {
  protected readonly services = [
    {
      id: 'toggle',
      path: '/toggle',
      label: 'Toggle',
      icon: 'toggle_on',
      color: 'var(--primary)',
      description: 'Simple binary switching.',
    },
    {
      id: 'cycle',
      path: '/cycle',
      label: 'Cycle',
      icon: 'sync',
      color: 'var(--accent)',
      description: 'Sequential theme stepping.',
    },
    {
      id: 'select',
      path: '/select',
      label: 'Select',
      icon: 'checklist',
      color: 'var(--info)',
      description: 'Direct selection from list.',
    },
  ];
}
