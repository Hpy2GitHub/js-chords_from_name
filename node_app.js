#!/usr/bin/env node

/**
 * show_chords.js: generate all possible ways to play a chord over a set range of the fretboard.
 * The chord is represented by its component notes.
 * -f specifies the start of the fretboard range; -n its length
 */

const fs = require('fs');
const process = require('process');

// Constants
const MAX_NOTES = 65;
const MAX_PATTERNS = 100;
const MAX_STRINGS = 6;
const MAX_FRETS = 26;

// Note constants
const _C = 0;
const _Db = 1;
const _D = 2;
const _Eb = 3;
const _E = 4;
const _F = 5;
const _Gb = 6;
const _G = 7;
const _Ab = 8;
const _A = 9;
const _Bb = 10;
const _B = 11;

const N_NOTES_IN_SCALE = 12;

// Fretboard display constants
const FSH = 0;  // horizontal: where the # 's go to mark the fret
const NSH = 5;  // horizontal: where a note starts
const DNH = 3;  // horizontal: delta to the next note

const NSV = 0;  // vertical: where a notes starts
const DNV = 2;  // vertical: delta to the next note

// Display characters
const BAR = '|';
const Y = '+';
const X = '-';
const Z = ' ';
const CRS = '+';

// String indices
const LOW_E = 0;
const A_STRING = 1;
const D_STRING = 2;
const G_STRING = 3;
const B_STRING = 4;
const HIGH_E = 5;

// Default tuning (EADGBE)
const DEFAULT_TUNING = [_E, _A, _D, _G, _B, _E];

// Global variables
let trace = 0;
let fretNotes = Array.from({ length: MAX_FRETS }, () => Array(MAX_STRINGS).fill(0));
const version = "Ver 1.7 (JavaScript)";

// Fretboard template
const strFret = [
    [Z, Z, Z, Z, Z, Z, Z, Z, Z, Z, Z, Z, Z, Z, Z, Z, Z, Z, Z, Z, Z, Z],
    [Z, Z, Z, Z, X, Y, X, X, Y, X, X, Y, X, X, Y, X, X, Y, X, X, Y, X],
    [Z, '1', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    [Z, '2', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    [Z, '3', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    [Z, '4', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    [Z, '5', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    [Z, '6', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    [Z, '7', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    [Z, '8', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    [Z, '9', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['1', '0', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['1', '1', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['1', '2', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['1', '3', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['1', '4', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['1', '5', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['1', '6', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['1', '7', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['1', '8', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['1', '9', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['2', '0', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['2', '1', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['2', '2', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['2', '3', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['2', '4', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z],
    [Z, Z, Z, Z, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X, X, CRS, X],
    ['2', '5', Z, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z, Z, BAR, Z]
];

class FingerPatterns {
    constructor() {
        this.f = Array.from({ length: MAX_PATTERNS }, () => Array(MAX_STRINGS).fill(0));
        this.n = 0;
    }
}

class StringList {
    constructor() {
        this.f = Array(MAX_FRETS).fill(0);
        this.n = 0;
    }
}

function nextNote(x) {
    return incNote(x, 1) % N_NOTES_IN_SCALE;
}

function incNote(x, y) {
    const result = (x + y) % N_NOTES_IN_SCALE;
    return result >= 0 ? result : result + N_NOTES_IN_SCALE;
}

function prHelp() {
    const usage = `sc [-f first fret] [-n range] [-h] [-T file] [-t trace] [-r root] <file
-f n     : SC will display chord fingerings over a 4 fret range.
           By default, frets 1 to 4 are used, but using -f you
            can start anywhere on the fretboard.
-h       : displays this message
-T file  : By default, the strings are tuned E A D G B E. 
           This option allows you to change the tuning by
           specifying a file which contains  6 notes to use.
           The first note is used on the low E string and the
           last one is used on the high  E string.
-t trace : prints out internal info as the program runs
-r root  : Normally, the first note of the input is used
           as the root note. SC displays fingerings
           with the root note in the bass first. You can
           over-ride this assignment by specifiying the root
           directly.
-n n     : how many frets to span; default = 4
-c n     : display each fingering for n seconds`;
    
    console.log(`${usage}\n${version}`);
    process.exit(1);
}

function letterOf(noteNum) {
    if (noteNum === _C) return 'C';
    if ([_Db, _D].includes(noteNum)) return 'D';
    if ([_Eb, _E].includes(noteNum)) return 'E';
    if (noteNum === _F) return 'F';
    if ([_Gb, _G].includes(noteNum)) return 'G';
    if ([_Ab, _A].includes(noteNum)) return 'A';
    if ([_Bb, _B].includes(noteNum)) return 'B';
    return '?';
}

function sharpRFlat(noteNum) {
    return [_Db, _Eb, _Gb, _Ab, _Bb].includes(noteNum) ? 'b' : ' ';
}

function prNote(note) {
    process.stdout.write(`${letterOf(note)}${sharpRFlat(note)}`);
}

function getNoteNum(chStart, letter) {
    chStart = chStart.toUpperCase();
    letter = letter ? letter.toLowerCase() : ' ';
    
    const noteMap = {
        'A': _A, 'B': _B, 'C': _C, 'D': _D,
        'E': _E, 'F': _F, 'G': _G
    };
    
    let noteNum = noteMap[chStart] || _C;
    
    if (letter === '#') noteNum += 1;
    else if (letter === 'b') noteNum -= 1;
    
    return noteNum % N_NOTES_IN_SCALE;
}

function inChord(note, chord, n) {
    return chord.slice(0, n).includes(note);
}

function isChord(ch1, n1, ch2, n2) {
    const sawNote = Array(N_NOTES_IN_SCALE).fill(false);
    
    for (let i = 0; i < n2; i++) {
        for (let j = 0; j < n1; j++) {
            if (ch2[i] === ch1[j]) {
                sawNote[i] = true;
            }
        }
    }
    
    return sawNote.slice(0, n2).every(x => x);
}

function squeezeNotes(n, noteList) {
    const uniqueNotes = [];
    const seen = new Set();
    
    for (let i = 0; i < n; i++) {
        const note = noteList[i];
        if (!seen.has(note)) {
            seen.add(note);
            uniqueNotes.push(note);
        }
    }
    
    return [uniqueNotes.length, uniqueNotes];
}

function initFb(fret) {
    for (let i = 0; i < strFret.length; i++) {
        for (let j = 0; j < strFret[0].length; j++) {
            fret[i][j] = strFret[i][j];
        }
    }
}

function markFb(string, fret) {
    for (let i = 0; i < MAX_STRINGS; i++) {
        const strx = NSH + (i * DNH);
        let stry, nc, nca;
        
        if (string[i] === -1) { // Unused string
            stry = 0;
            nc = 'X';
            nca = ' ';
        } else if (string[i] === 0) { // Open string
            stry = 0;
            const note = fretNotes[0][i];
            nc = letterOf(note);
            nca = sharpRFlat(note);
        } else { // Fretted note
            stry = NSV + (string[i] * DNV);
            const note = fretNotes[string[i]][i];
            nc = letterOf(note);
            nca = sharpRFlat(note);
        }
        
        fret[stry][strx] = nc;
        fret[stry][strx + 1] = nca;
    }
}

function showFb(start, stop, fret) {
    const b = NSV + (DNV * start);
    const e = NSV + (DNV * (stop + 1));
    
    // Display open notes and top of fretboard if needed
    if (start !== 0) {
        for (let j = 0; j < 2; j++) {
            console.log(fret[j].join(''));
        }
    }
    
    // Display active region
    for (let j = b; j < e; j++) {
        console.log(fret[j].join(''));
    }
}

function buildPat(p, c, chord, chLen, root) {
    const maxN = MAX_PATTERNS;
    const prefOrder = Array.from({ length: 4 }, () => Array(3).fill(0)); // For LOW_E, A_STRING, D_STRING
    
    if (trace > 5) {
        console.log(`build_pat: max # of possible patterns is ${maxN}`);
    }
    
    // Create preference order with root notes first
    for (const s of [LOW_E, A_STRING, D_STRING]) {
        let t = 0;
        let b = p[s].n - 1;
        
        for (let f = 0; f < p[s].n; f++) {
            const j = p[s].f[f];
            if (fretNotes[j][s] === root) {
                prefOrder[s][t] = j;
                t++;
            } else {
                prefOrder[s][b] = j;
                b--;
            }
        }
    }
    
    if (trace > 3) {
        console.log("build_pat: effective data structure");
        for (let j = 0; j < 3; j++) {
            console.log(`build_pat: string #${j}: ${prefOrder[j].slice(0, p[j].n).join(' ')}`);
        }
        for (let j = 3; j < MAX_STRINGS; j++) {
            console.log(`build_pat: string #${j}: ${p[j].f.slice(0, p[j].n).join(' ')}`);
        }
    }
    
    // Generate all possible finger patterns
    let n = 0;
    for (let le = 0; le < p[LOW_E].n; le++) {
        for (let as = 0; as < p[A_STRING].n; as++) {
            for (let ds = 0; ds < p[D_STRING].n; ds++) {
                for (let gs = 0; gs < p[G_STRING].n; gs++) {
                    for (let bs = 0; bs < p[B_STRING].n; bs++) {
                        for (let he = 0; he < p[HIGH_E].n; he++) {
                            if (n < maxN) {
                                c.f[n][LOW_E] = prefOrder[LOW_E][le];
                                c.f[n][A_STRING] = prefOrder[A_STRING][as];
                                c.f[n][D_STRING] = prefOrder[D_STRING][ds];
                                c.f[n][G_STRING] = p[G_STRING].f[gs];
                                c.f[n][B_STRING] = p[B_STRING].f[bs];
                                c.f[n][HIGH_E] = p[HIGH_E].f[he];
                                
                                const thisChord = Array.from({ length: MAX_STRINGS }, (_, j) => 
                                    fretNotes[c.f[n][j]][j]);
                                
                                if (isChord(thisChord, MAX_STRINGS, chord, chLen)) {
                                    n++;
                                }
                            } else {
                                if (trace) {
                                    console.log(`build_pat: can only make ${maxN} patterns`);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    c.n = n;
}

function getCh(input) {
    const chord = [];
    let state = 0; // IN_FILLER
    let chStart = '';
    let i = 0;
    
    while (i < input.length) {
        const letter = input[i];
        i++;
        
        if (letter === '\n') break;
        
        if (state === 0) { // IN_FILLER
            if (/[ABCDEFG]/i.test(letter)) {
                state = 1; // CHORD_START
                chStart = letter.toUpperCase();
            }
        } else if (state === 1) { // CHORD_START
            const note = getNoteNum(chStart, letter);
            chord.push(note);
            state = 0;
        }
    }
    
    // Handle case where chord ends with a note (no following character)
    if (state === 1) {
        const note = getNoteNum(chStart, ' ');
        chord.push(note);
    }
    
    const [n, uniqueChord] = squeezeNotes(chord.length, chord);
    return [uniqueChord, n];
}

function retune(tuningFile) {
    try {
        const data = fs.readFileSync(tuningFile, 'utf8');
        const [chord, n] = getCh(data);
        
        if (n < MAX_STRINGS) {
            console.log(`error in tuning file ... need ${MAX_STRINGS} notes found ${n}!`);
            process.exit(1);
        }
        
        for (let i = 0; i < MAX_STRINGS; i++) {
            fretNotes[0][i] = chord[i];
        }
        
        tune();
    } catch (err) {
        console.log(`can't open tuning file '${tuningFile}'`);
        process.exit(1);
    }
}

function tune() {
    for (let i = 1; i < MAX_FRETS; i++) {
        for (let j = 0; j < MAX_STRINGS; j++) {
            fretNotes[i][j] = incNote(fretNotes[i - 1][j], 1);
        }
    }
}

function scs(chord, chordLen, firstFret, fretRange, doClear, sec, root) {
    let lastFret = firstFret + fretRange - 1;
    
    if (lastFret > MAX_FRETS - 1) {
        lastFret = MAX_FRETS - 1;
    }
    
    if (firstFret > MAX_FRETS - 1) {
        console.log(`scs: first fret ${firstFret} is bigger than # of frets (${MAX_FRETS})!`);
        process.exit(1);
    }
    
    // Initialize possible notes on each string
    const possible = Array.from({ length: MAX_STRINGS }, () => new StringList());
    
    // Check open strings if not starting at top
    if (firstFret !== 0) {
        for (let s = 0; s < MAX_STRINGS; s++) {
            if (inChord(fretNotes[0][s], chord, chordLen)) {
                possible[s].f[0] = 0;
                possible[s].n++;
            }
        }
    }
    
    // Check fretted notes in range
    for (let s = 0; s < MAX_STRINGS; s++) {
        for (let f = firstFret; f <= lastFret; f++) {
            if (inChord(fretNotes[f][s], chord, chordLen)) {
                const n = possible[s].n;
                possible[s].f[n] = f;
                possible[s].n++;
            }
        }
    }
    
    // Mark unused strings
    for (let s = 0; s < MAX_STRINGS; s++) {
        if (possible[s].n === 0) {
            possible[s].f[0] = -1;
            possible[s].n = 1;
        }
    }
    
    if (trace > 3) {
        console.log("scs: usable fret numbers on each string:");
        for (let j = 0; j < MAX_STRINGS; j++) {
            console.log(`scs: string #${j}: ${possible[j].f.slice(0, possible[j].n).join(' ')}`);
        }
    }
    
    // Build finger patterns
    const chPatterns = new FingerPatterns();
    buildPat(possible, chPatterns, chord, chordLen, root);
    
    if (trace > 3) {
        console.log(`scs: here's the data structure ch_patterns (length ${chPatterns.n})`);
        for (let j = 0; j < chPatterns.n; j++) {
            console.log(`scs: ch_patterns [${j.toString().padStart(2, '0')}] ---> ${chPatterns.f[j].join(' ')}`);
        }
    }
    
    // Display each pattern
    const fb = Array.from({ length: strFret.length }, () => Array(strFret[0].length).fill(Z));
    
    for (let j = 0; j < chPatterns.n; j++) {
        initFb(fb);
        markFb(chPatterns.f[j], fb);
        
        console.log(`\nchord fingering #${j + 1} of ${chPatterns.n}\n`);
        showFb(firstFret, lastFret, fb);
        console.log();
        
        if (doClear) {
            // Sleep functionality would require additional implementation in Node.js
            // For now, just continue without delay
        }
    }
}

function parseArguments() {
    const args = process.argv.slice(2);
    const options = {
        firstFret: 1,
        range: 4,
        trace: 0,
        tuningFile: null,
        root: null,
        help: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '-f':
                options.firstFret = parseInt(args[++i]) || 1;
                break;
            case '-n':
                options.range = parseInt(args[++i]) || 4;
                break;
            case '-t':
                options.trace = parseInt(args[++i]) || 0;
                break;
            case '-T':
                options.tuningFile = args[++i];
                break;
            case '-r':
                options.root = args[++i];
                break;
            case '-h':
                options.help = true;
                break;
        }
    }
    
    return options;
}

function main() {
    const options = parseArguments();
    
    if (options.help) {
        prHelp();
    }
    
    trace = options.trace;
    const firstFret = options.firstFret;
    const fretRange = options.range;
    let rootNote = 0;
    
    // Initialize fretboard with default tuning
    for (let i = 0; i < MAX_STRINGS; i++) {
        fretNotes[0][i] = DEFAULT_TUNING[i];
    }
    tune();
    
    // Handle alternate tuning if specified
    if (options.tuningFile) {
        retune(options.tuningFile);
    }
    
    // Parse root note if specified
    if (options.root) {
        if (options.root.length === 1) {
            rootNote = getNoteNum(options.root[0], ' ');
        } else {
            rootNote = getNoteNum(options.root[0], options.root[1]);
        }
    }
    
    // Read from stdin
    let input = '';
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('readable', () => {
        const chunk = process.stdin.read();
        if (chunk !== null) {
            input += chunk;
        }
    });
    
    process.stdin.on('end', () => {
        const lines = input.split('\n');
        
        for (const line of lines) {
            if (line.trim()) {
                const [chord, chordLen] = getCh(line + '\n');
                
                if (chordLen > 0) {
                    if (rootNote === 0) {
                        rootNote = chord[0];
                    }
                    
                    scs(chord, chordLen, firstFret, fretRange, false, 0, rootNote);
                }
            }
        }
    });
}

// If running as a script (not imported as a module)
if (require.main === module) {
    main();
}
