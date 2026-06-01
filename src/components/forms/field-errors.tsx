type FieldErrorsProps = {
  errors?: Record<string, string[] | undefined>;
};

export function FieldErrors({ errors }: FieldErrorsProps) {
  if (!errors) return null;
  const entries = Object.entries(errors).filter(([, v]) => v?.length);
  if (!entries.length) return null;
  return (
    <ul className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {entries.map(([key, msgs]) => (
        <li key={key}>
          <span className="font-medium capitalize">{key}:</span>{" "}
          {msgs?.join(", ")}
        </li>
      ))}
    </ul>
  );
}
