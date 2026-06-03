import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-service-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'md:col-span-2 block h-full',
  },
  template: `
    <div
      class="rounded-3xl bg-card-bg backdrop-blur-xl border border-card-border p-8 md:p-10 flex flex-col justify-between min-h-[220px] h-full"
    >
      <div>
        <h1
          class="text-4xl md:text-6xl font-black tracking-tighter bg-gradient-to-r from-[var(--primary,oklch(0.7_0.2_250))] to-[var(--accent,oklch(0.6_0.25_320))] bg-clip-text text-transparent font-outfit select-none transition-all duration-1000 leading-[1.1]"
        >
          {{ title() }}
        </h1>
        <p class="text-sm text-text-muted/80 font-inter mt-3 max-w-sm leading-relaxed">
          {{ description() }}
        </p>
      </div>
      <div class="flex flex-wrap gap-1.5 mt-6">
        @for (tag of tags(); track tag) {
          <span
            class="px-2.5 py-1 bg-tag-bg rounded-full text-[9px] font-bold text-tag-text border border-white/5 uppercase tracking-wider"
          >
            {{ tag }}
          </span>
        }
      </div>
    </div>
  `,
})
export class ServiceHeaderComponent {
  public readonly title = input.required<string>();
  public readonly description = input.required<string>();
  public readonly tags = input<string[]>([]);
}
