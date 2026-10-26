interface TagsProps {
  readonly items: readonly string[];
  readonly tone?: 'paper' | 'ink';
}

export function Tags({ items, tone = 'paper' }: TagsProps) {
  return (
    <ul className={`tags tags--${tone}`}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
