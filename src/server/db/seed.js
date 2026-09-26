import { getDb, runQuery, queryAll, saveDb } from './database.js';
import bcrypt from 'bcryptjs';

/**
 * Seeds the database with demo data for the Brilliance platform.
 * 
 * Creates:
 * - 5 Topics (Logic, Math, Physics, CS, Science)
 * - 25 Quizzes (5 per topic, difficulty 1-5)
 * - 95+ Questions (5 per quiz with explanations)
 * - 15 Badge definitions (streak, mastery, milestone, special)
 * - 9 Users (1 admin, 7 learners with varied progress, 1 fresh demo)
 * - Learner topic stats (for adaptive engine demo)
 * - Sample attempts and daily activity history
 * - Sample badge awards
 */

async function seed() {
  const db = await getDb();
  console.log('🌱 Seeding Brilliance database...\n');

  // Clear existing data in dependency order
  const tables = ['user_rewards', 'rewards', 'daily_activity', 'learner_topic_stats', 'user_badges', 'responses', 'attempts', 'questions', 'quizzes', 'badges', 'topics', 'users'];
  for (const table of tables) {
    db.run(`DELETE FROM ${table}`);
  }
  saveDb();

  // ============ TOPICS ============
  console.log('📚 Creating topics...');
  const topics = [
    ['Logic & Puzzles', 'logic-puzzles', 'Sharpen your critical thinking with brain teasers and logical reasoning challenges.', '🧩', '#6C63FF'],
    ['Mathematics', 'mathematics', 'Master algebra, geometry, and number theory through interactive problems.', '🔢', '#F59E0B'],
    ['Physics', 'physics', 'Explore mechanics, energy, and waves with hands-on conceptual challenges.', '⚡', '#10B981'],
    ['Computer Science', 'computer-science', 'Learn algorithms, data structures, and computational thinking.', '💻', '#EC4899'],
    ['Science & Nature', 'science-nature', 'Discover biology, chemistry, and the natural world through engaging quizzes.', '🔬', '#8B5CF6'],
  ];

  for (const [name, slug, desc, icon, color] of topics) {
    runQuery('INSERT INTO topics (name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?)', [name, slug, desc, icon, color]);
  }

  // ============ QUIZZES ============
  console.log('📝 Creating quizzes (25 total, 5 per topic)...');
  const quizzes = [
    // Logic & Puzzles (topic_id=1)
    [1, 'Pattern Recognition Basics', 'Identify patterns in sequences and shapes.', 1, 120, 100],
    [1, 'Logical Deduction', 'Use clues to reach conclusions.', 2, 150, 150],
    [1, 'Advanced Riddles', 'Solve complex multi-step logic puzzles.', 3, 180, 200],
    [1, 'Master Logic Challenge', 'Expert-level logical reasoning problems.', 4, 200, 300],
    [1, 'Logic Grandmaster', 'The ultimate test of logical prowess.', 5, 240, 500],
    // Mathematics (topic_id=2)
    [2, 'Number Basics', 'Fundamental arithmetic and number properties.', 1, 120, 100],
    [2, 'Algebra Foundations', 'Solve basic equations and inequalities.', 2, 150, 150],
    [2, 'Geometry Explorer', 'Angles, areas, and spatial reasoning.', 3, 180, 200],
    [2, 'Advanced Algebra', 'Complex equations and function analysis.', 4, 200, 300],
    [2, 'Math Olympiad Prep', 'Competition-level mathematics problems.', 5, 240, 500],
    // Physics (topic_id=3)
    [3, 'Motion & Forces Intro', 'Basic concepts of Newtonian mechanics.', 1, 120, 100],
    [3, 'Energy & Work', 'Understanding kinetic and potential energy.', 2, 150, 150],
    [3, 'Waves & Sound', 'Properties of waves, frequency, and resonance.', 3, 180, 200],
    [3, 'Electricity & Magnetism', 'Circuits, fields, and electromagnetic phenomena.', 4, 200, 300],
    [3, 'Quantum Concepts', 'Introductory quantum mechanics puzzles.', 5, 240, 500],
    // Computer Science (topic_id=4)
    [4, 'Binary & Data', 'Understanding binary, bits, and data representation.', 1, 120, 100],
    [4, 'Algorithm Thinking', 'Basic sorting, searching, and complexity.', 2, 150, 150],
    [4, 'Data Structures', 'Arrays, stacks, queues, and trees.', 3, 180, 200],
    [4, 'Graph Algorithms', 'BFS, DFS, shortest paths, and trees.', 4, 200, 300],
    [4, 'System Design Basics', 'Scalability, databases, and architecture.', 5, 240, 500],
    // Science & Nature (topic_id=5)
    [5, 'Cell Biology Basics', 'Cell structure, organelles, and functions.', 1, 120, 100],
    [5, 'Chemistry Fundamentals', 'Elements, compounds, and reactions.', 2, 150, 150],
    [5, 'Ecology & Ecosystems', 'Food webs, biomes, and biodiversity.', 3, 180, 200],
    [5, 'Human Body Systems', 'Anatomy, physiology, and health.', 4, 200, 300],
    [5, 'Advanced Chemistry', 'Organic chemistry and molecular structures.', 5, 240, 500],
  ];

  for (const [topicId, title, desc, diff, time, xp] of quizzes) {
    runQuery(
      'INSERT INTO quizzes (topic_id, title, description, difficulty, time_limit_seconds, xp_reward) VALUES (?, ?, ?, ?, ?, ?)',
      [topicId, title, desc, diff, time, xp]
    );
  }

  // ============ QUESTIONS ============
  console.log('❓ Creating questions (5 per quiz, 125 total)...');
  const allQuestions = [
    // Quiz 1: Pattern Recognition Basics (Logic, difficulty 1)
    [1, 'What comes next in the sequence: 2, 4, 8, 16, ?', 'mcq', '20', '24', '32', '64', 'C', 'Each number is doubled. 16 × 2 = 32.', 1, 10, 1],
    [1, 'Complete the pattern: A, C, E, G, ?', 'mcq', 'H', 'I', 'J', 'K', 'B', 'The pattern skips one letter each time. G + 2 = I.', 1, 10, 2],
    [1, 'What is the next number: 1, 1, 2, 3, 5, 8, ?', 'mcq', '10', '11', '13', '15', 'C', 'This is the Fibonacci sequence. 5 + 8 = 13.', 1, 10, 3],
    [1, 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops Lazzies?', 'mcq', 'Yes', 'No', 'Maybe', 'Not enough info', 'A', 'Transitive logic: If A⊂B and B⊂C, then A⊂C.', 1, 10, 4],
    [1, 'Find the odd one out: 3, 5, 11, 14, 17, 23', 'mcq', '5', '11', '14', '23', 'C', '14 is the only even number; all others are odd.', 1, 10, 5],

    // Quiz 2: Logical Deduction (Logic, difficulty 2)
    [2, 'If it rains, the ground gets wet. The ground is wet. Can you conclude it rained?', 'mcq', 'Yes, definitely', 'No, not necessarily', 'Only if nothing else could wet the ground', 'We need more information', 'B', 'This is affirming the consequent — a logical fallacy.', 2, 10, 1],
    [2, 'Alice is taller than Bob. Bob is taller than Charlie. Who is the shortest?', 'mcq', 'Alice', 'Bob', 'Charlie', 'Cannot determine', 'C', 'From the transitive property: Alice > Bob > Charlie.', 2, 10, 2],
    [2, 'A box has 3 red and 5 blue balls. Minimum draws to guarantee a red ball?', 'mcq', '3', '4', '5', '6', 'D', 'Worst case: draw all 5 blue first, then the 6th must be red.', 2, 10, 3],
    [2, 'If no heroes are cowards and some soldiers are cowards, then:', 'mcq', 'All soldiers are heroes', 'No soldiers are heroes', 'Some soldiers might be heroes', 'Some soldiers are definitely not heroes', 'D', 'Soldiers who are cowards cannot be heroes.', 2, 10, 4],
    [2, 'In a race, you overtake the person in 2nd place. What position are you in?', 'mcq', '1st', '2nd', '3rd', 'Cannot determine', 'B', 'You took 2nd place. You did not overtake 1st.', 2, 10, 5],

    // Quiz 3: Advanced Riddles (Logic, difficulty 3)
    [3, 'I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?', 'mcq', 'A flag', 'An echo', 'A shadow', 'A whistle', 'B', 'An echo repeats sound without a mouth or ears.', 3, 10, 1],
    [3, 'A farmer has 17 sheep. All but 9 die. How many are left?', 'mcq', '8', '9', '17', '0', 'B', '"All but 9" means 9 survive.', 3, 10, 2],
    [3, 'A boat is full of people but not a single person is on board. Why?', 'mcq', 'They went below deck', 'They all jumped off', 'They were all married', 'The boat is a toy', 'C', 'Not a SINGLE person — they are all married (couples).', 3, 10, 3],
    [3, 'What has keys but no locks, space but no room, and you can enter but cannot go inside?', 'mcq', 'A map', 'A keyboard', 'A puzzle', 'A dream', 'B', 'A keyboard has keys, a space bar, and an enter key.', 3, 10, 4],
    [3, 'If you have me, you want to share me. If you share me, you have not got me. What am I?', 'mcq', 'A secret', 'Money', 'Time', 'Love', 'A', 'A secret: once shared, it is no longer a secret.', 3, 10, 5],

    // Quiz 4: Master Logic Challenge (Logic, difficulty 4)
    [4, 'Three boxes labeled "Apples", "Oranges", "Mixed" — all labels wrong. You pick an apple from "Mixed". What is in "Oranges"?', 'mcq', 'Oranges', 'Apples', 'Mixed', 'Cannot determine', 'C', 'Since all labels are wrong and "Mixed" has apples, "Oranges" must have mixed.', 4, 10, 1],
    [4, 'A bat and ball cost $1.10. The bat costs $1 more than the ball. How much is the ball?', 'mcq', '$0.10', '$0.05', '$0.15', '$0.01', 'B', 'If ball=x, bat=x+1. x+(x+1)=1.10, 2x=0.10, x=$0.05.', 4, 10, 2],
    [4, 'In a room of 23 people, approximate probability two share a birthday?', 'mcq', 'About 10%', 'About 25%', 'About 50%', 'About 75%', 'C', 'The Birthday Paradox: ~50.7% chance with 23 people.', 4, 10, 3],
    [4, '12 coins, one fake (lighter). Minimum weighings on a balance to find it?', 'mcq', '2', '3', '4', '6', 'B', 'Divide into groups of 4. Three weighings suffice.', 4, 10, 4],
    [4, 'If SEND + MORE = MONEY, what digit does M represent?', 'mcq', '0', '1', '2', '9', 'B', 'M must be 1 — max carry from adding two 4-digit numbers is 1.', 4, 10, 5],

    // Quiz 5: Logic Grandmaster (Logic, difficulty 5)
    [5, 'Monty Hall: You pick door 1. Host opens door 3 (goat). Should you switch?', 'mcq', 'Yes, switching gives 2/3 chance', 'No, both doors have 1/2 chance', 'It depends on the host', 'Switching makes no difference', 'A', 'Switching gives 2/3 probability vs 1/3 for staying.', 5, 10, 1],
    [5, 'Two guards, one always lies, one always tells truth. What single question finds the safe door?', 'mcq', 'Which door is safe?', 'What would the other guard say is safe?', 'Are you the truthful guard?', 'Is the left door safe?', 'B', 'Ask what the OTHER would say, then choose the opposite.', 5, 10, 2],
    [5, 'Tower of Hanoi: minimum moves for 5 disks?', 'mcq', '15', '25', '31', '63', 'C', '2^n - 1 = 2^5 - 1 = 31.', 5, 10, 3],
    [5, '8 balls, one heavier. Minimum weighings on a balance?', 'mcq', '1', '2', '3', '4', 'B', 'Divide 3-3-2. Weigh 3v3. If equal weigh the 2; if not weigh 1v1.', 5, 10, 4],
    [5, 'Next in look-and-say: 1, 11, 21, 1211, 111221, ?', 'mcq', '312211', '1112221', '122111', '312312', 'A', '111221 reads as "three 1s, two 2s, one 1" → 312211.', 5, 10, 5],

    // Quiz 6: Number Basics (Math, difficulty 1)
    [6, 'What is the sum of the first 10 natural numbers?', 'mcq', '45', '50', '55', '60', 'C', 'n(n+1)/2 = 10(11)/2 = 55.', 1, 10, 1],
    [6, 'Which number is both a perfect square and a perfect cube?', 'mcq', '16', '27', '36', '64', 'D', '64 = 8² = 4³.', 1, 10, 2],
    [6, 'What is 15% of 200?', 'mcq', '25', '30', '35', '40', 'B', '15/100 × 200 = 30.', 1, 10, 3],
    [6, 'The LCM of 12 and 18 is:', 'mcq', '24', '36', '54', '72', 'B', 'LCM(12,18) = 36.', 1, 10, 4],
    [6, 'What is the next prime number after 7?', 'mcq', '8', '9', '10', '11', 'D', '8, 9, 10 are composite. 11 is prime.', 1, 10, 5],

    // Quiz 7: Algebra Foundations (Math, difficulty 2)
    [7, 'Solve for x: 2x + 5 = 13', 'mcq', '3', '4', '5', '6', 'B', '2x = 8, x = 4.', 2, 10, 1],
    [7, 'If f(x) = 3x - 2, what is f(5)?', 'mcq', '11', '13', '15', '17', 'B', 'f(5) = 15 - 2 = 13.', 2, 10, 2],
    [7, 'Simplify: (x² - 9) / (x - 3)', 'mcq', 'x + 3', 'x - 3', 'x² - 3', '(x-3)²', 'A', 'Difference of squares: (x+3)(x-3)/(x-3) = x+3.', 2, 10, 3],
    [7, 'What is the slope of y = -2x + 7?', 'mcq', '7', '2', '-2', '-7', 'C', 'In y=mx+b, slope m = -2.', 2, 10, 4],
    [7, 'If 3^x = 81, what is x?', 'mcq', '2', '3', '4', '5', 'C', '3⁴ = 81, so x = 4.', 2, 10, 5],

    // Quiz 8: Geometry Explorer (Math, difficulty 3)
    [8, 'Sum of interior angles of a hexagon?', 'mcq', '540°', '600°', '720°', '900°', 'C', '(n-2)×180 = 4×180 = 720°.', 3, 10, 1],
    [8, 'Circle with radius 7. Area? (π ≈ 22/7)', 'mcq', '44', '154', '308', '616', 'B', 'πr² = (22/7)(49) = 154.', 3, 10, 2],
    [8, 'Right triangle sides 3, 4, and ?', 'mcq', '5', '6', '7', '8', 'A', '3² + 4² = 25 = 5².', 3, 10, 3],
    [8, 'How many faces does a dodecahedron have?', 'mcq', '8', '10', '12', '20', 'C', 'A dodecahedron has 12 pentagonal faces.', 3, 10, 4],
    [8, 'Parallel lines cut by transversal: alternate interior angles are:', 'mcq', 'Supplementary', 'Equal', 'Complementary', 'None of these', 'B', 'Alternate interior angles are equal.', 3, 10, 5],

    // Quiz 9: Advanced Algebra (Math, difficulty 4)
    [9, 'Roots of x² - 5x + 6 = 0?', 'mcq', '1 and 6', '2 and 3', '-2 and -3', '1 and 5', 'B', '(x-2)(x-3)=0, x=2 or x=3.', 4, 10, 1],
    [9, 'If log₂(x) = 5, what is x?', 'mcq', '10', '25', '32', '64', 'C', '2⁵ = 32.', 4, 10, 2],
    [9, 'Sum of infinite geometric series: a=4, r=1/2?', 'mcq', '4', '6', '8', '∞', 'C', 'Sum = a/(1-r) = 4/0.5 = 8.', 4, 10, 3],
    [9, 'Determinant of [[3,1],[2,4]]?', 'mcq', '10', '14', '5', '8', 'A', '(3)(4)-(1)(2) = 10.', 4, 10, 4],
    [9, 'Derivative of x³?', 'mcq', '3x', '3x²', 'x⁴/4', '2x³', 'B', 'Power rule: 3x².', 4, 10, 5],

    // Quiz 10: Math Olympiad Prep (Math, difficulty 5)
    [10, 'How many trailing zeros in 100!?', 'mcq', '20', '24', '25', '30', 'B', 'Count factors of 5: 20+4 = 24.', 5, 10, 1],
    [10, 'What is the remainder when 2^100 is divided by 3?', 'mcq', '0', '1', '2', 'Cannot determine', 'B', '2^n mod 3 cycles: 2,1,2,1... Even power → remainder 1.', 5, 10, 2],
    [10, 'In how many ways can 5 people sit in a row?', 'mcq', '25', '60', '120', '720', 'C', '5! = 120.', 5, 10, 3],
    [10, 'Sum of the series: 1/2 + 1/4 + 1/8 + ... (infinite)?', 'mcq', '1/2', '3/4', '1', '2', 'C', 'Geometric series: a/(1-r) = (1/2)/(1/2) = 1.', 5, 10, 4],
    [10, 'If a polygon has 35 diagonals, how many sides does it have?', 'mcq', '8', '9', '10', '12', 'C', 'n(n-3)/2 = 35 → n=10.', 5, 10, 5],

    // Quiz 11: Motion & Forces Intro (Physics, difficulty 1)
    [11, 'What is the SI unit of force?', 'mcq', 'Joule', 'Newton', 'Watt', 'Pascal', 'B', 'Force is measured in Newtons (N).', 1, 10, 1],
    [11, 'An object at rest stays at rest unless acted on by a force. This is:', 'mcq', 'First Law', 'Second Law', 'Third Law', 'Law of Gravity', 'A', 'Newton\'s First Law (Law of Inertia).', 1, 10, 2],
    [11, 'A car travels 100 km in 2 hours. Average speed?', 'mcq', '25 km/h', '50 km/h', '75 km/h', '200 km/h', 'B', 'Speed = Distance/Time = 50 km/h.', 1, 10, 3],
    [11, 'Double the force on an object. What happens to acceleration?', 'mcq', 'Halved', 'Same', 'Doubled', 'Quadrupled', 'C', 'F=ma: double F → double a.', 1, 10, 4],
    [11, 'Which is a vector quantity?', 'mcq', 'Speed', 'Mass', 'Temperature', 'Velocity', 'D', 'Velocity has magnitude and direction.', 1, 10, 5],

    // Quiz 12: Energy & Work (Physics, difficulty 2)
    [12, 'Formula for kinetic energy?', 'mcq', 'mgh', '½mv²', 'Fd', 'mv', 'B', 'KE = ½mv².', 2, 10, 1],
    [12, '2 kg ball lifted 5m. Potential energy? (g=10)', 'mcq', '50 J', '100 J', '25 J', '10 J', 'B', 'PE = mgh = 2×10×5 = 100 J.', 2, 10, 2],
    [12, 'Work is defined as:', 'mcq', 'Force × Time', 'Force × Distance', 'Mass × Acceleration', 'Energy × Time', 'B', 'W = F × d (in direction of force).', 2, 10, 3],
    [12, 'A stretched spring stores what energy?', 'mcq', 'Kinetic', 'Thermal', 'Elastic potential', 'Chemical', 'C', 'Deformed springs store elastic PE.', 2, 10, 4],
    [12, 'Conservation of energy states energy:', 'mcq', 'Can be created', 'Can be destroyed', 'Always increases', 'Cannot be created or destroyed', 'D', 'Energy transforms but total is conserved.', 2, 10, 5],

    // Quiz 13: Waves & Sound (Physics, difficulty 3)
    [13, 'Sound cannot travel through:', 'mcq', 'Air', 'Water', 'Steel', 'Vacuum', 'D', 'Sound needs a medium.', 3, 10, 1],
    [13, 'Frequency is measured in:', 'mcq', 'Meters', 'Seconds', 'Hertz', 'Newtons', 'C', 'Hz = cycles per second.', 3, 10, 2],
    [13, 'What determines pitch?', 'mcq', 'Amplitude', 'Frequency', 'Wavelength', 'Speed', 'B', 'Higher frequency = higher pitch.', 3, 10, 3],
    [13, 'The Doppler effect explains why:', 'mcq', 'Light bends', 'Pitch changes as source moves', 'Echoes occur', 'Sound is faster in solids', 'B', 'Relative motion causes frequency shifts.', 3, 10, 4],
    [13, 'Speed of sound in air (approx)?', 'mcq', '100 m/s', '343 m/s', '500 m/s', '1000 m/s', 'B', '~343 m/s at room temperature.', 3, 10, 5],

    // Quiz 14: Electricity & Magnetism (Physics, difficulty 4)
    [14, 'Ohm\'s Law states:', 'mcq', 'V = IR', 'P = IV', 'F = ma', 'E = mc²', 'A', 'Voltage = Current × Resistance.', 4, 10, 1],
    [14, 'Two 10Ω resistors in parallel. Total resistance?', 'mcq', '20Ω', '10Ω', '5Ω', '2.5Ω', 'C', '1/Rt = 1/10 + 1/10 = 2/10, Rt = 5Ω.', 4, 10, 2],
    [14, 'What creates a magnetic field?', 'mcq', 'Static charge', 'Moving charge', 'Gravity', 'Light', 'B', 'Moving charges (current) create magnetic fields.', 4, 10, 3],
    [14, 'Unit of electrical power?', 'mcq', 'Volt', 'Ampere', 'Watt', 'Ohm', 'C', 'Power = Watts = V × I.', 4, 10, 4],
    [14, 'Faraday\'s law relates to:', 'mcq', 'Gravitational force', 'Electromagnetic induction', 'Thermodynamics', 'Fluid mechanics', 'B', 'Changing magnetic flux induces EMF.', 4, 10, 5],

    // Quiz 15: Quantum Concepts (Physics, difficulty 5)
    [15, 'The Heisenberg Uncertainty Principle states you cannot simultaneously know:', 'mcq', 'Mass and volume', 'Position and momentum', 'Speed and direction', 'Charge and spin', 'B', 'Position and momentum cannot both be precisely known.', 5, 10, 1],
    [15, 'What is wave-particle duality?', 'mcq', 'Waves become particles at high speed', 'Particles exhibit both wave and particle properties', 'Only light has this property', 'It disproves quantum mechanics', 'B', 'All matter exhibits wave-particle duality.', 5, 10, 2],
    [15, 'Schrödinger\'s cat thought experiment illustrates:', 'mcq', 'Animal behavior', 'Superposition of states', 'Gravity', 'Thermodynamics', 'B', 'A system exists in all states until observed.', 5, 10, 3],
    [15, 'The photoelectric effect proved that light:', 'mcq', 'Is a wave', 'Is made of particles (photons)', 'Travels at infinite speed', 'Has no mass', 'B', 'Einstein showed light comes in discrete packets.', 5, 10, 4],
    [15, 'What is quantum entanglement?', 'mcq', 'Particles stuck together', 'Correlated particles affect each other instantly', 'Particles that repel', 'Energy conservation in atoms', 'B', 'Entangled particles have correlated states regardless of distance.', 5, 10, 5],

    // Quiz 16: Binary & Data (CS, difficulty 1)
    [16, 'Binary of decimal 10?', 'mcq', '1010', '1001', '1100', '1110', 'A', '10 = 8+2 = 1010.', 1, 10, 1],
    [16, 'How many bits in a byte?', 'mcq', '4', '8', '16', '32', 'B', '1 byte = 8 bits.', 1, 10, 2],
    [16, '1011 + 1101 in binary?', 'mcq', '11000', '10110', '11100', '10100', 'A', '11+13=24=11000.', 1, 10, 3],
    [16, 'Best data type for true/false?', 'mcq', 'Integer', 'Float', 'Boolean', 'String', 'C', 'Boolean stores true/false values.', 1, 10, 4],
    [16, 'Max decimal value in 4 bits?', 'mcq', '8', '15', '16', '32', 'B', '1111 = 15.', 1, 10, 5],

    // Quiz 17: Algorithm Thinking (CS, difficulty 2)
    [17, 'Time complexity of binary search?', 'mcq', 'O(n)', 'O(log n)', 'O(n²)', 'O(1)', 'B', 'Halves search space each step.', 2, 10, 1],
    [17, 'Which sort is always O(n log n)?', 'mcq', 'Bubble Sort', 'Quick Sort', 'Merge Sort', 'Selection Sort', 'C', 'Merge Sort guarantees O(n log n).', 2, 10, 2],
    [17, 'FIFO stands for?', 'mcq', 'First In, First Out', 'First In, Final Out', 'Final In, First Out', 'Fast Input, Fast Output', 'A', 'FIFO = First In, First Out (queues).', 2, 10, 3],
    [17, 'A self-calling algorithm is:', 'mcq', 'Iterative', 'Recursive', 'Dynamic', 'Greedy', 'B', 'Recursion = function calls itself.', 2, 10, 4],
    [17, 'Best-case Bubble Sort complexity?', 'mcq', 'O(1)', 'O(n)', 'O(n log n)', 'O(n²)', 'B', 'O(n) with early-exit optimization.', 2, 10, 5],

    // Quiz 18: Data Structures (CS, difficulty 3)
    [18, 'Which uses LIFO?', 'mcq', 'Queue', 'Stack', 'Array', 'Linked List', 'B', 'Stack = Last In, First Out.', 3, 10, 1],
    [18, 'Worst-case BST search?', 'mcq', 'O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'C', 'Skewed BST degrades to O(n).', 3, 10, 2],
    [18, 'Hash table average lookup?', 'mcq', 'O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'A', 'Hash → O(1) average via hashing.', 3, 10, 3],
    [18, 'Node with 2 children is called:', 'mcq', 'Leaf', 'Internal node', 'Root', 'Sibling', 'B', 'Internal nodes have at least one child.', 3, 10, 4],
    [18, 'Root → Left → Right traversal?', 'mcq', 'Inorder', 'Preorder', 'Postorder', 'Level order', 'B', 'Preorder visits root first.', 3, 10, 5],

    // Quiz 19: Graph Algorithms (CS, difficulty 4)
    [19, 'BFS uses which data structure?', 'mcq', 'Stack', 'Queue', 'Heap', 'Array', 'B', 'BFS uses a queue for level-order traversal.', 4, 10, 1],
    [19, 'Dijkstra\'s algorithm finds:', 'mcq', 'MST', 'Shortest path', 'Longest path', 'All cycles', 'B', 'Dijkstra finds shortest paths from source.', 4, 10, 2],
    [19, 'A tree with n nodes has how many edges?', 'mcq', 'n', 'n-1', 'n+1', '2n', 'B', 'A tree always has n-1 edges.', 4, 10, 3],
    [19, 'DFS uses which data structure?', 'mcq', 'Queue', 'Stack', 'Heap', 'Hash table', 'B', 'DFS uses a stack (or recursion).', 4, 10, 4],
    [19, 'Kruskal\'s algorithm finds:', 'mcq', 'Shortest path', 'MST', 'Topological sort', 'Max flow', 'B', 'Kruskal\'s finds Minimum Spanning Tree.', 4, 10, 5],

    // Quiz 20: System Design (CS, difficulty 5)
    [20, 'CAP theorem: you can have at most __ of Consistency, Availability, Partition tolerance?', 'mcq', '1', '2', '3', 'All', 'B', 'CAP: pick 2 out of 3.', 5, 10, 1],
    [20, 'Which scaling adds more machines?', 'mcq', 'Vertical', 'Horizontal', 'Diagonal', 'Linear', 'B', 'Horizontal scaling = more machines.', 5, 10, 2],
    [20, 'What does a load balancer do?', 'mcq', 'Store data', 'Distribute traffic', 'Encrypt data', 'Cache content', 'B', 'Distributes incoming requests across servers.', 5, 10, 3],
    [20, 'Redis is primarily used as a:', 'mcq', 'Relational DB', 'In-memory cache', 'File system', 'Message queue only', 'B', 'Redis is an in-memory data store/cache.', 5, 10, 4],
    [20, 'Eventual consistency means:', 'mcq', 'Data is never consistent', 'All replicas converge over time', 'Data is always consistent', 'Only reads are consistent', 'B', 'Given enough time, all replicas will have the same data.', 5, 10, 5],

    // Quiz 21: Cell Biology (Science, difficulty 1)
    [21, 'What is the powerhouse of the cell?', 'mcq', 'Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus', 'C', 'Mitochondria produce ATP.', 1, 10, 1],
    [21, 'Which organelle contains genetic material?', 'mcq', 'Cytoplasm', 'Nucleus', 'Cell membrane', 'Lysosome', 'B', 'The nucleus contains DNA.', 1, 10, 2],
    [21, 'Plant cells have ___ that animal cells lack:', 'mcq', 'Mitochondria', 'Nucleus', 'Cell wall', 'Ribosomes', 'C', 'Cell wall made of cellulose.', 1, 10, 3],
    [21, 'Plants convert sunlight to energy via:', 'mcq', 'Respiration', 'Photosynthesis', 'Fermentation', 'Osmosis', 'B', 'Photosynthesis converts light to glucose.', 1, 10, 4],
    [21, 'What controls cell entry/exit?', 'mcq', 'Cell wall', 'Cytoplasm', 'Cell membrane', 'Nucleus', 'C', 'Cell membrane is selectively permeable.', 1, 10, 5],

    // Quiz 22: Chemistry Fundamentals (Science, difficulty 2)
    [22, 'Chemical symbol for gold?', 'mcq', 'Go', 'Gd', 'Au', 'Ag', 'C', 'Au from Latin "aurum".', 2, 10, 1],
    [22, 'Number of elements in periodic table?', 'mcq', '92', '108', '118', '126', 'C', '118 confirmed elements.', 2, 10, 2],
    [22, 'Bond between Na and Cl?', 'mcq', 'Covalent', 'Ionic', 'Metallic', 'Hydrogen', 'B', 'NaCl = ionic bond.', 2, 10, 3],
    [22, 'pH of pure water?', 'mcq', '0', '5', '7', '14', 'C', 'Neutral pH = 7.', 2, 10, 4],
    [22, 'Rust is an example of:', 'mcq', 'Physical change', 'Chemical change', 'Nuclear reaction', 'No change', 'B', 'Rust = iron oxide (chemical change).', 2, 10, 5],

    // Quiz 23: Ecology (Science, difficulty 3)
    [23, 'A food chain starts with:', 'mcq', 'Herbivore', 'Carnivore', 'Producer', 'Decomposer', 'C', 'Producers (plants) form the base.', 3, 10, 1],
    [23, 'Largest biome on Earth?', 'mcq', 'Desert', 'Tundra', 'Ocean', 'Rainforest', 'C', 'Oceans cover ~71% of Earth.', 3, 10, 2],
    [23, 'Biodiversity means:', 'mcq', 'Number of animals only', 'Variety of life in an area', 'Size of an ecosystem', 'Age of a habitat', 'B', 'Variety of all living things.', 3, 10, 3],
    [23, 'Decomposers are important because they:', 'mcq', 'Produce oxygen', 'Break down dead matter', 'Hunt prey', 'Photosynthesize', 'B', 'Recycle nutrients from dead organisms.', 3, 10, 4],
    [23, 'An omnivore eats:', 'mcq', 'Only plants', 'Only animals', 'Both plants and animals', 'Only insects', 'C', 'Omnivore = plants + animals.', 3, 10, 5],

    // Quiz 24: Human Body Systems (Science, difficulty 4)
    [24, 'Largest organ in the human body?', 'mcq', 'Liver', 'Brain', 'Skin', 'Lungs', 'C', 'Skin is the largest organ.', 4, 10, 1],
    [24, 'Red blood cells are produced in:', 'mcq', 'Liver', 'Heart', 'Bone marrow', 'Spleen', 'C', 'Bone marrow produces RBCs.', 4, 10, 2],
    [24, 'The smallest bone in the body is in the:', 'mcq', 'Finger', 'Toe', 'Ear', 'Nose', 'C', 'The stapes in the middle ear.', 4, 10, 3],
    [24, 'How many chambers does the human heart have?', 'mcq', '2', '3', '4', '5', 'C', 'Four chambers: 2 atria + 2 ventricles.', 4, 10, 4],
    [24, 'The nervous system\'s basic unit is:', 'mcq', 'Cell', 'Neuron', 'Organ', 'Tissue', 'B', 'Neurons transmit electrical signals.', 4, 10, 5],

    // Quiz 25: Advanced Chemistry (Science, difficulty 5)
    [25, 'The benzene ring has how many carbon atoms?', 'mcq', '4', '5', '6', '8', 'C', 'Benzene: C₆H₆, hexagonal ring of 6 carbons.', 5, 10, 1],
    [25, 'An isomer has the same:', 'mcq', 'Structure', 'Molecular formula', 'Boiling point', 'Density', 'B', 'Same formula, different structure.', 5, 10, 2],
    [25, 'Avogadro\'s number is approximately:', 'mcq', '3.14 × 10²³', '6.02 × 10²³', '1.6 × 10⁻¹⁹', '9.8 × 10¹', 'B', '6.022 × 10²³ particles per mole.', 5, 10, 3],
    [25, 'What type of reaction is combustion?', 'mcq', 'Endothermic', 'Exothermic', 'Neutral', 'Isothermal', 'B', 'Combustion releases heat (exothermic).', 5, 10, 4],
    [25, 'A catalyst works by:', 'mcq', 'Adding energy', 'Lowering activation energy', 'Increasing temperature', 'Adding more reactant', 'B', 'Catalysts lower activation energy.', 5, 10, 5],
  ];

  for (const [quizId, text, type, a, b, c, d, correct, explanation, diff, pts, order] of allQuestions) {
    runQuery(
      `INSERT INTO questions (quiz_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, points, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [quizId, text, type, a, b, c, d, correct, explanation, diff, pts, order]
    );
  }

  // ============ BADGES ============
  console.log('🏅 Creating badges (15 definitions)...');
  const badges = [
    ['First Flame', 'Complete quizzes 3 days in a row', '🔥', 'streak', 'streak_count', 3, 'common', 50],
    ['Streak Master', 'Maintain a 7-day learning streak', '⚡', 'streak', 'streak_count', 7, 'rare', 150],
    ['Unstoppable', 'Keep the flame alive for 14 days straight', '🌟', 'streak', 'streak_count', 14, 'epic', 500],
    ['Perfect Score', 'Score 100% on any quiz', '🎯', 'mastery', 'perfect_score', 1, 'common', 75],
    ['Hat Trick', 'Get 3 perfect scores', '🎩', 'mastery', 'perfect_score', 3, 'rare', 200],
    ['Topic Expert', '90%+ average across 5+ quizzes in a topic', '🧠', 'topic', 'topic_mastery', 90, 'rare', 300],
    ['Grand Master', 'Reach master level in 3+ topics', '🏆', 'mastery', 'multi_topic_master', 3, 'legendary', 1000],
    ['Rising Star', 'Reach Level 5', '📈', 'milestone', 'level_reached', 5, 'common', 100],
    ['Diamond Mind', 'Reach Level 20', '💎', 'milestone', 'level_reached', 20, 'epic', 750],
    ['Challenge Accepted', 'Complete 50 quizzes', '🎮', 'milestone', 'quizzes_completed', 50, 'rare', 250],
    ['First Steps', 'Complete your very first quiz', '👣', 'milestone', 'quizzes_completed', 1, 'common', 25],
    ['Knowledge Seeker', 'Complete 10 quizzes', '📖', 'milestone', 'quizzes_completed', 10, 'common', 75],
    ['Comeback Kid', 'Improve from low to 85%+ in a topic', '🔄', 'special', 'comeback', 1, 'rare', 200],
    ['Speed Demon', 'Complete a quiz under 30s with 80%+', '⏱️', 'special', 'speed_complete', 30, 'rare', 150],
    ['Explorer', 'Attempt quizzes in all 5 topics', '🗺️', 'milestone', 'topics_explored', 5, 'common', 100],
  ];

  for (const [name, desc, icon, cat, condType, condVal, rarity, xpBonus] of badges) {
    runQuery(
      `INSERT INTO badges (name, description, icon, category, condition_type, condition_value, rarity, xp_bonus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, desc, icon, cat, condType, condVal, rarity, xpBonus]
    );
  }

  // ============ USERS ============
  console.log('👥 Creating users (1 admin + 7 learners + 1 demo)...');
  const passwordHash = bcrypt.hashSync('demo123', 10);
  const today = new Date().toISOString().split('T')[0];

  const users = [
    ['admin', 'admin@brilliance.edu', passwordHash, 'Dr. Sarah Chen', 'admin', 'admin', 0, 1, 0, 0, today],
    ['alice', 'alice@demo.com', passwordHash, 'Alice Johnson', 'learner', 'alice', 2450, 8, 5, 12, today],
    ['bob', 'bob@demo.com', passwordHash, 'Bob Williams', 'learner', 'bob', 1800, 6, 3, 7, today],
    ['charlie', 'charlie@demo.com', passwordHash, 'Charlie Davis', 'learner', 'charlie', 3200, 11, 14, 14, today],
    ['diana', 'diana@demo.com', passwordHash, 'Diana Martinez', 'learner', 'diana', 950, 4, 1, 5, today],
    ['eve', 'eve@demo.com', passwordHash, 'Eve Anderson', 'learner', 'eve', 4100, 14, 8, 21, today],
    ['frank', 'frank@demo.com', passwordHash, 'Frank Thompson', 'learner', 'frank', 600, 3, 0, 3, today],
    ['grace', 'grace@demo.com', passwordHash, 'Grace Lee', 'learner', 'grace', 1500, 5, 7, 10, today],
    ['demo', 'demo@brilliance.edu', passwordHash, 'Demo Learner', 'learner', 'demo', 0, 1, 0, 0, today],
  ];

  for (const [username, email, hash, name, role, avatar, xp, level, streak, longest, lastActive] of users) {
    runQuery(
      `INSERT INTO users (username, email, password_hash, display_name, role, avatar_seed, total_xp, current_level, current_streak, longest_streak, last_active_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hash, name, role, avatar, xp, level, streak, longest, lastActive]
    );
  }

  // ============ LEARNER TOPIC STATS ============
  console.log('📊 Creating learner topic stats for adaptive engine...');
  const stats = [
    // Alice (id=2) - good at Logic & Math
    [2, 1, 8, 35, 40, 87.5, 3, 'advanced', today],
    [2, 2, 6, 25, 30, 83.3, 3, 'intermediate', today],
    [2, 3, 3, 10, 15, 66.7, 2, 'beginner', today],
    // Bob (id=3) - average
    [3, 1, 5, 18, 25, 72.0, 2, 'intermediate', today],
    [3, 4, 4, 14, 20, 70.0, 2, 'intermediate', today],
    // Charlie (id=4) - strong everywhere
    [4, 1, 12, 55, 60, 91.7, 4, 'master', today],
    [4, 2, 10, 42, 50, 84.0, 4, 'advanced', today],
    [4, 3, 8, 34, 40, 85.0, 3, 'advanced', today],
    [4, 4, 6, 28, 30, 93.3, 4, 'master', today],
    [4, 5, 5, 20, 25, 80.0, 3, 'intermediate', today],
    // Diana (id=5) - struggling
    [5, 1, 4, 8, 20, 40.0, 1, 'beginner', today],
    [5, 2, 3, 7, 15, 46.7, 1, 'beginner', today],
    // Eve (id=6) - top performer
    [6, 1, 15, 70, 75, 93.3, 5, 'master', today],
    [6, 2, 12, 55, 60, 91.7, 5, 'master', today],
    [6, 3, 10, 44, 50, 88.0, 4, 'master', today],
    [6, 4, 8, 36, 40, 90.0, 4, 'advanced', today],
    [6, 5, 7, 30, 35, 85.7, 3, 'advanced', today],
  ];

  for (const [userId, topicId, attempts, correct, seen, avg, diff, mastery, date] of stats) {
    runQuery(
      `INSERT INTO learner_topic_stats (user_id, topic_id, total_attempts, correct_answers, total_questions_seen, avg_score, current_difficulty, mastery_level, last_attempt_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, topicId, attempts, correct, seen, avg, diff, mastery, date]
    );
  }

  // ============ SAMPLE ATTEMPTS ============
  console.log('🎯 Creating sample attempt history...');
  const sampleAttempts = [
    [2, 1, 50, 50, 100, 85, 1, 2], [2, 2, 40, 50, 120, 110, 2, 2],
    [2, 3, 30, 50, 80, 150, 3, 2], [2, 6, 45, 50, 140, 95, 2, 3],
    [4, 1, 50, 50, 100, 60, 1, 2], [4, 2, 50, 50, 150, 80, 2, 3],
    [4, 3, 45, 50, 180, 100, 3, 4], [4, 16, 50, 50, 100, 55, 1, 2],
    [5, 1, 20, 50, 40, 120, 1, 1], [5, 6, 15, 50, 30, 130, 1, 1],
    [6, 1, 50, 50, 100, 45, 1, 3], [6, 2, 50, 50, 150, 70, 2, 4],
    [6, 6, 50, 50, 100, 50, 1, 3], [6, 11, 45, 50, 100, 90, 1, 2],
  ];

  for (const [userId, quizId, score, maxScore, xp, time, diffStart, diffEnd] of sampleAttempts) {
    runQuery(
      `INSERT INTO attempts (user_id, quiz_id, score, max_score, xp_earned, time_taken_seconds, difficulty_at_start, difficulty_at_end, completed, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
      [userId, quizId, score, maxScore, xp, time, diffStart, diffEnd]
    );
  }

  // ============ SAMPLE BADGES EARNED ============
  console.log('🏅 Awarding sample badges...');
  const badgeAwards = [
    [2, 11], [2, 1], [2, 12],  // Alice
    [4, 11], [4, 4], [4, 1], [4, 2], [4, 3], [4, 8], [4, 12],  // Charlie
    [6, 11], [6, 4], [6, 5], [6, 1], [6, 2], [6, 6], [6, 8], [6, 9], [6, 12], [6, 10], [6, 15],  // Eve
    [5, 11],  // Diana
  ];

  for (const [userId, badgeId] of badgeAwards) {
    runQuery('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)', [userId, badgeId]);
  }

  // ============ DAILY ACTIVITY ============
  console.log('📅 Creating 14-day activity history...');
  for (let d = 13; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];

    // Alice: active most days
    if (d !== 8 && d !== 10) {
      runQuery('INSERT OR IGNORE INTO daily_activity (user_id, activity_date, quizzes_completed, xp_earned, time_spent_seconds) VALUES (?, ?, ?, ?, ?)',
        [2, dateStr, Math.floor(Math.random() * 3) + 1, Math.floor(Math.random() * 200) + 50, Math.floor(Math.random() * 600) + 120]);
    }
    // Charlie: every day
    runQuery('INSERT OR IGNORE INTO daily_activity (user_id, activity_date, quizzes_completed, xp_earned, time_spent_seconds) VALUES (?, ?, ?, ?, ?)',
      [4, dateStr, Math.floor(Math.random() * 4) + 2, Math.floor(Math.random() * 300) + 100, Math.floor(Math.random() * 900) + 200]);
    // Eve: active most days
    if (d !== 5) {
      runQuery('INSERT OR IGNORE INTO daily_activity (user_id, activity_date, quizzes_completed, xp_earned, time_spent_seconds) VALUES (?, ?, ?, ?, ?)',
        [6, dateStr, Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 400) + 100, Math.floor(Math.random() * 1200) + 300]);
    }
    // Bob: sporadic
    if (d % 3 === 0) {
      runQuery('INSERT OR IGNORE INTO daily_activity (user_id, activity_date, quizzes_completed, xp_earned, time_spent_seconds) VALUES (?, ?, ?, ?, ?)',
        [3, dateStr, 1, Math.floor(Math.random() * 150) + 50, Math.floor(Math.random() * 300) + 60]);
    }
    // Diana: minimal
    if (d === 5 || d === 4 || d === 3) {
      runQuery('INSERT OR IGNORE INTO daily_activity (user_id, activity_date, quizzes_completed, xp_earned, time_spent_seconds) VALUES (?, ?, ?, ?, ?)',
        [5, dateStr, 1, Math.floor(Math.random() * 50) + 20, Math.floor(Math.random() * 200) + 60]);
    }
  }

  // ============ REWARDS CATALOG ============
  console.log('💎 Creating rewards catalog...');
  const rewards = [
    ['T-Shirt', 'Premium Brilliance branded T-shirt', '👕', 'merchandise', 500],
    ['Stationery Kit', 'Complete study kit with notebook and pens', '📚', 'stationery', 300],
    ['Water Bottle', 'Eco-friendly water bottle', '💧', 'merchandise', 400],
    ['Streak Recovery x1', 'Recover 1 lost streak day', '🔥', 'streak_recovery', 100],
    ['Streak Recovery x3', 'Recover 3 lost streak days', '🔥', 'streak_recovery', 250],
    ['XP Boost x2', 'Double XP for next 5 quizzes', '⚡', 'boost', 350],
    ['Premium Badge', 'Exclusive premium achievement badge', '⭐', 'merchandise', 600],
    ['Notebook Set', 'Set of 3 premium notebooks', '📓', 'stationery', 200],
  ];

  for (const [name, desc, icon, cat, cost] of rewards) {
    runQuery(
      'INSERT INTO rewards (name, description, icon, category, cost_gems, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [name, desc, icon, cat, cost]
    );
  }

  // ============ INITIAL GEMS FOR USERS ============
  console.log('💎 Assigning initial gems to users...');
  for (let userId = 2; userId <= 9; userId++) {
    const initialGems = Math.floor(Math.random() * 500) + 200;
    runQuery(
      'UPDATE users SET total_gems = ? WHERE id = ?',
      [initialGems, userId]
    );
  }

  console.log('\n✅ Database seeded successfully!');
  console.log('   📚 5 Topics (Logic, Math, Physics, CS, Science)');
  console.log('   📝 25 Quizzes (5 per topic, difficulty 1-5)');
  console.log('   ❓ 125 Questions (5 per quiz with explanations)');
  console.log('   🏅 15 Badge definitions (streak/mastery/milestone/special)');
  console.log('   👥 9 Users (1 admin + 7 learners + 1 fresh demo)');
  console.log('   📊 Learner topic stats + attempt history + daily activity');
  console.log('\n   Demo credentials (all use password: demo123):');
  console.log('   👨‍🏫  Admin:      admin');
  console.log('   👩‍🎓  Fresh demo: demo');
  console.log('   👩‍🎓  Active:     alice, bob, charlie, eve, grace');
  console.log('   👩‍🎓  Struggling: diana');
  console.log('   👩‍🎓  Inactive:   frank');
}

seed();
