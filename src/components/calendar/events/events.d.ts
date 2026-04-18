export type Spielort = 'heim' | 'auswaerts';

export type Spiel = {
    datum: string;
    isoWeekYear: number;
    kalenderwoche: number;
    gegner: string;
    spielort: Spielort;
    anstoss: string;
};

export type EventsResult = {
    verein: string;
    wettbewerb: string;
    saison: string;
    quelle: {
        name: string;
        url: string;
        abgerufenAm: string;
    };
    spiele: Spiel[];
};