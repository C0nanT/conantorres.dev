const TIME_ZONE = 'America/Sao_Paulo'

const dateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Full years between `birthDate` (YYYY-MM-DD) and `now`, taking the
 * calendar day in America/Sao_Paulo as "today". */
export function getAge(birthDate: string, now: Date): number {
  const [birthYear = 0, birthMonth = 0, birthDay = 0] = birthDate
    .split('-')
    .map(Number)
  const [year = 0, month = 0, day = 0] = dateFormat
    .format(now)
    .split('-')
    .map(Number)

  const hadBirthday =
    month > birthMonth || (month === birthMonth && day >= birthDay)
  return year - birthYear - (hadBirthday ? 0 : 1)
}
