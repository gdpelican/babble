let flatten = (array) => [].concat.apply([], array);

let compact = (array) => array.filter(Boolean);

export {
  flatten,
  compact
}