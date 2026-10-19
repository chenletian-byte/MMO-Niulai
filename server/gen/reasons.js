// Shared bank of geometry / proof reasons (O-Level conventions).
// label: what goes in the bracket; full: the full English phrase; kw: phrases accepted in free typing.
export const REASONS = {
  given: { label: 'given', full: 'Given', kw: ['given'] },
  common_side: { label: 'common side', full: 'Common side', kw: ['common side', 'common'] },
  common_angle: { label: 'common angle', full: 'Common angle', kw: ['common angle', 'common'] },
  vert_opp: { label: 'vertically opposite angles', full: 'Vertically opposite angles are equal', kw: ['vertically opposite', 'vert opp', 'vertically opp'] },
  alt: { label: 'alternate angles', full: 'Alternate angles are equal (parallel lines)', kw: ['alternate angle', 'alt angle'] },
  corr: { label: 'corresponding angles', full: 'Corresponding angles are equal (parallel lines)', kw: ['corresponding angle', 'corr angle'] },
  co_int: { label: 'interior angles', full: 'Interior (co-interior) angles add up to 180°', kw: ['interior angle', 'co interior', 'cointerior', 'int angle', 'allied angle'] },
  adj_line: { label: 'angles on a straight line', full: 'Adjacent angles on a straight line add up to 180°', kw: ['straight line', 'str line', 'adj angle'] },
  ang_pt: { label: 'angles at a point', full: 'Angles at a point add up to 360°', kw: ['angle at a point', 'at a point'] },
  tri_sum: { label: 'angle sum of triangle', full: 'Angle sum of a triangle is 180°', kw: ['angle sum of triangle', 'angle sum triangle', 'sum of triangle', 'angle sum'] },
  ext_ang: { label: 'exterior angle of triangle', full: 'Exterior angle of a triangle equals the sum of the interior opposite angles', kw: ['exterior angle', 'ext angle'] },
  isos: { label: 'base angles of isosceles triangle', full: 'Base angles of an isosceles triangle are equal', kw: ['isosceles', 'isos', 'base angle'] },
  poly_sum: { label: 'angle sum of polygon', full: 'Interior angle sum of an n-sided polygon is (n − 2) × 180°', kw: ['polygon', 'n 2 180'] },
  radii: { label: 'radii', full: 'Radii of the same circle are equal', kw: ['radii', 'radius', 'radiu'] },
  tan_rad: { label: 'tangent perpendicular to radius', full: 'A tangent is perpendicular to the radius at the point of contact', kw: ['tangent perpendicular radius', 'tan perpendicular rad', 'tan rad', 'tangent radius'] },
  tan_ext: { label: 'tangents from external point', full: 'Tangents from an external point are equal in length', kw: ['tangents from external point', 'tangent from ext', 'external point', 'ext pt'] },
  semicircle: { label: 'angle in a semicircle', full: 'The angle in a semicircle is a right angle', kw: ['semicircle', 'semi circle'] },
  centre: { label: 'angle at centre is twice angle at circumference', full: 'The angle at the centre is twice the angle at the circumference', kw: ['angle at centre', 'centre twice', 'at centre', 'twice angle'] },
  same_seg: { label: 'angles in the same segment', full: 'Angles in the same segment are equal', kw: ['same segment', 'same seg'] },
  cyclic: { label: 'angles in opposite segments', full: 'Opposite angles of a cyclic quadrilateral add up to 180°', kw: ['opposite segment', 'opp seg', 'cyclic quad', 'cyclic quadrilateral', 'cyclic'] },
  alt_seg: { label: 'alternate segment theorem', full: 'Alternate segment theorem: the angle between a tangent and a chord equals the angle in the alternate segment', kw: ['alternate segment', 'alt seg'] },
  perp_chord: { label: 'perpendicular from centre bisects chord', full: 'The perpendicular from the centre to a chord bisects the chord', kw: ['perpendicular bisector', 'bisect chord', 'perpendicular from centre', 'bisector of chord'] },
  sss: { label: 'SSS', full: 'Side–Side–Side congruence', kw: ['sss'] },
  sas: { label: 'SAS', full: 'Side–Angle–Side congruence', kw: ['sas'] },
  asa: { label: 'ASA', full: 'Angle–Side–Angle congruence', kw: ['asa'] },
  aas: { label: 'AAS', full: 'Angle–Angle–Side congruence', kw: ['aas'] },
  rhs: { label: 'RHS', full: 'Right angle–Hypotenuse–Side congruence', kw: ['rhs'] },
  aa_sim: { label: 'AA similarity', full: 'Two pairs of equal angles ⇒ similar triangles', kw: ['aa', 'aaa', 'aa similar', 'equiangular'] },
  sas_sim: { label: 'SAS similarity', full: 'Two pairs of sides in the same ratio with the included angle equal', kw: ['sas similar', 'sas'] },
  cong_sides: { label: 'corresponding sides of congruent triangles', full: 'Corresponding sides of congruent triangles are equal', kw: ['corresponding side', 'corr side', 'congruent triangle side'] },
  cong_angles: { label: 'corresponding angles of congruent triangles', full: 'Corresponding angles of congruent triangles are equal', kw: ['corresponding angle congruent', 'corr angle congruent', 'congruent triangle angle'] },
  sim_angles: { label: 'corresponding angles of similar triangles', full: 'Corresponding angles of similar triangles are equal', kw: ['corresponding angle similar', 'corr angle similar', 'similar triangle angle'] },
  sim_ratio: { label: 'corresponding sides of similar triangles', full: 'Corresponding sides of similar triangles are in the same ratio', kw: ['similar triangle', 'corr side similar', 'ratio'] },
  midpt_thm: { label: 'midpoint theorem', full: 'Midpoint theorem: the line joining midpoints of two sides is parallel to the third side and half its length', kw: ['midpoint theorem', 'mid point theorem', 'midpoint thm'] },
  midpoint: { label: 'definition of midpoint', full: 'Definition of a midpoint', kw: ['midpoint', 'mid point'] },
  conv_alt: { label: 'converse of alternate angles', full: 'Converse: if alternate angles are equal, the lines are parallel', kw: ['converse alternate', 'alternate angle equal', 'alt equal'] },
  conv_corr: { label: 'converse of corresponding angles', full: 'Converse: if corresponding angles are equal, the lines are parallel', kw: ['converse corresponding', 'corr equal'] },
  parallelogram: { label: 'opposite sides of parallelogram', full: 'Opposite sides of a parallelogram are equal and parallel', kw: ['parallelogram'] },
  pythag: { label: 'Pythagoras\' theorem', full: "Pythagoras' theorem", kw: ['pythagoras', 'pythag'] },
  conv_pythag: { label: 'converse of Pythagoras\' theorem', full: "Converse of Pythagoras' theorem", kw: ['converse pythagoras', 'converse of pythagoras'] },
  // algebra / calculus justifications
  disc_neg: { label: 'discriminant is negative', full: 'b² − 4ac < 0 so there are no real roots', kw: ['discriminant negative', 'discriminant less than 0', 'b2 4ac 0', 'discriminant'] },
  disc_pos: { label: 'discriminant is positive', full: 'b² − 4ac > 0 so there are two distinct real roots', kw: ['discriminant positive', 'discriminant greater', 'discriminant'] },
  disc_zero: { label: 'discriminant is zero', full: 'b² − 4ac = 0 so there is one repeated real root', kw: ['discriminant zero', 'discriminant equal', 'discriminant'] },
  coeff_pos: { label: 'coefficient of x² is positive', full: 'The coefficient of x² is positive, so the curve opens upwards', kw: ['coefficient positive', 'a 0', 'opens upward', 'coefficient of x2'] },
  sq_nonneg: { label: 'a square is never negative', full: 'A square of a real number is never negative', kw: ['square', 'never negative', 'non negative', 'nonnegative'] },
  d2_pos: { label: 'second derivative is positive, so minimum', full: 'Second derivative positive ⇒ minimum point', kw: ['second derivative positive', 'second derivative', 'd2y'] },
  d2_neg: { label: 'second derivative is negative, so maximum', full: 'Second derivative negative ⇒ maximum point', kw: ['second derivative negative', 'second derivative', 'd2y'] },
  dy_pos: { label: 'gradient is positive, so increasing', full: 'Gradient positive for all x ⇒ increasing function', kw: ['gradient positive', 'dy dx positive', 'increasing'] },
  pyth_id: { label: 'sin²x + cos²x = 1', full: 'Pythagorean identity', kw: ['sin2 cos2', 'pythagorean identity', 'identity'] },
  sec_id: { label: '1 + tan²x = sec²x', full: 'Pythagorean identity in tan / sec', kw: ['sec2', 'tan2', '1 tan2'] },
  double_angle: { label: 'double angle formula', full: 'Double angle formula', kw: ['double angle'] },
  factor_thm: { label: 'factor theorem', full: 'Factor theorem: f(a) = 0 ⇔ (x − a) is a factor', kw: ['factor theorem'] },
  remainder_thm: { label: 'remainder theorem', full: 'Remainder theorem: remainder = f(a)', kw: ['remainder theorem'] },
};

export function reasonLabel(id) {
  return REASONS[id] ? REASONS[id].label : id;
}

export function publicReasons() {
  const out = {};
  for (const [k, v] of Object.entries(REASONS)) out[k] = { label: v.label, full: v.full };
  return out;
}

function normText(s) {
  return String(s)
    .toLowerCase()
    .replace(/∠/g, ' angle ')
    .replace(/△/g, ' triangle ')
    .replace(/∥/g, ' parallel ')
    .replace(/⊥/g, ' perpendicular ')
    .replace(/[²]/g, '2')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w))
    .join(' ');
}

// Free-text reason matching: every word of one accepted keyword phrase must appear.
export function matchReasonText(text, acceptIds) {
  const t = ' ' + normText(text) + ' ';
  if (!t.trim()) return false;
  for (const id of acceptIds) {
    const r = REASONS[id];
    if (!r) continue;
    for (const k of r.kw) {
      const words = normText(k).split(' ');
      if (words.every((w) => t.includes(' ' + w + ' ') || (w.length > 4 && t.includes(w)))) return true;
    }
  }
  return false;
}
