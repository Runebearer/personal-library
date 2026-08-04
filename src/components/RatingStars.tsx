export function RatingStars({
  rating,
  onChange,
  size = 'md',
}: {
  rating: number
  onChange?: (rating: number) => void
  size?: 'sm' | 'md'
}) {
  const textSize = size === 'sm' ? 'text-sm' : 'text-xl'

  return (
    <div className={`flex gap-0.5 ${textSize}`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(value === rating ? 0 : value)}
          aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <span className={value <= rating ? 'text-amber-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </div>
  )
}
