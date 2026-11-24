const lessons = [
  ["09:00", "Aluno A", "Matemática", "Presencial"],
  ["14:00", "Aluna B", "Português", "Online"],
  ["16:30", "Aluno C", "Ciências", "Presencial"],
] as const;

export function TodayPreview() {
  return (
    <figure className="relative mx-auto w-full max-w-[23rem] rounded-[2rem] border border-beige bg-yellow/40 px-3 py-6 sm:px-6 md:px-4 lg:px-8">
      <div className="mx-auto w-full max-w-[18.5rem] rounded-[2rem] border-[5px] border-navy bg-background p-3 shadow-xl shadow-navy/15 sm:p-4">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 h-1 w-10 rounded-full bg-beige"
        />
        <p className="text-xl font-bold text-brown">Hoje</p>
        <p className="text-sm text-secondary-text">
          <time dateTime="2026-11-23">Segunda-feira, 23 de novembro</time>
        </p>
        <dl className="my-4 grid grid-cols-2 gap-2">
          <div className="flex flex-col-reverse rounded-lg bg-yellow/60 p-2 text-sm">
            <dt>Aulas hoje</dt>
            <dd className="text-lg font-bold">3</dd>
          </div>
          <div className="flex flex-col-reverse rounded-lg border bg-card p-2 text-sm">
            <dt>A receber</dt>
            <dd className="text-lg font-bold">R$ 180</dd>
          </div>
        </dl>
        <ul className="grid gap-2">
          {lessons.map(([time, student, subject, modality]) => (
            <li
              key={time}
              className="flex flex-wrap items-center justify-between gap-x-1 gap-y-2 rounded-lg border bg-card p-2 text-xs"
            >
              <div className="min-w-0">
                <p className="font-bold">
                  <time dateTime={time}>{time}</time> · {student}
                </p>
                <p className="mt-0.5 text-secondary-text">{subject}</p>
              </div>
              <span className="rounded-full bg-muted px-2 py-1 font-semibold">
                {modality}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-3 text-center text-xs text-secondary-text">
        Exemplo com dados fictícios
      </figcaption>
    </figure>
  );
}
