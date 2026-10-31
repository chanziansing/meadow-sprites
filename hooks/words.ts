// Kiki's day in Koriko, by what the turn is doing: the spinner's words, and the line that closes a turn.

export const FLIGHT: Record<'requesting' | 'thinking' | 'tool-input' | 'tool-use' | 'responding', readonly string[]> = {
  requesting: ['Taking off', 'Catching the sea wind', 'Mounting the broom', 'Leaving the bakery'],
  thinking: ['Asking Jiji', 'Reading the map', 'Thinking it over at the bakery', 'Watching the clock tower'],
  'tool-input': ['Wrapping the parcel', 'Tying the red bow', 'Packing the basket'],
  'tool-use': ['Delivering the parcel', 'Flying over Koriko', 'Weaving past the rooftops', 'Riding the updraft'],
  responding: ['Landing softly', 'Knocking on the door', 'Handing over the parcel', 'Writing the receipt'],
}
export const LANDED = ['Delivered', 'Landed', 'Flew', 'Baked', 'Wrapped', 'Swept']
