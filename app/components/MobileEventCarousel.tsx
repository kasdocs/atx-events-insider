import { ReactNode } from 'react';

export default function MobileEventCarousel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-12">
      <div
        className="
          flex gap-6 overflow-x-auto pb-4 -mx-4 px-4
          snap-x snap-mandatory
          md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:grid md:grid-cols-2
          scroll-px-4
          [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
          overscroll-x-contain
        "
      >
        {children}
      </div>
    </div>
  );
}
