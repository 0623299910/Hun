type LegacyFrameProps = {
  html: string;
  title: string;
};

export function LegacyFrame({ html, title }: LegacyFrameProps) {
  return (
    <iframe
      title={title}
      srcDoc={html}
      className="h-[78vh] w-full rounded-2xl border border-ink/10 bg-white shadow-soft"
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
    />
  );
}
