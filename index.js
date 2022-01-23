const id_to_team = {}
const team_to_id = {}
const match_table = {}
const team_to_img = {}
const find_match_index = {}
let MAJOR_SLOTS = 0
let WILD_CARD = 0
let GROUP_STAGE = 0
let PLAYOFF = 0
const team_ratings = {}

const tied_places = new Set()

const original_matches = {}

const NUM_OF_RUNS = 10000
const UPDATE_NUM = 250

const dividing_lines = []

let curr_update = 0

function load_tables(LEAGUE_ID, playoff, groups, wild) {
    PLAYOFF = playoff
    GROUP_STAGE = groups
    WILD_CARD = wild
    MAJOR_SLOTS = PLAYOFF + GROUP_STAGE + WILD_CARD

    dividing_lines.push(0)
    dividing_lines.push(PLAYOFF)
    if (GROUP_STAGE !== 0) {
        dividing_lines.push(dividing_lines[dividing_lines.length-1]+GROUP_STAGE)
    }
    if (WILD_CARD !== 0) {
        dividing_lines.push(dividing_lines[dividing_lines.length-1]+WILD_CARD)
    }
    dividing_lines.push(6)
    // console.log(dividing_lines)

    let teams_request = new XMLHttpRequest();
    teams_request.open('GET', `https://api.opendota.com/api/leagues/${LEAGUE_ID}/teams`);

    teams_request.responseType = 'json';
    teams_request.send()

    const valid_teams = new Set()
    if (LEAGUE_ID === 13740) { // WEU Div2
        valid_teams.add(8261397)
        valid_teams.add(8343488)
        valid_teams.add(8344760)
        valid_teams.add(8390848)
        valid_teams.add(8598715)
        valid_teams.add(8112124)
        valid_teams.add(8597391)
        valid_teams.add(8605863)
    }
    else if (LEAGUE_ID === 13742) { // NA Div2
        valid_teams.add(8205424)
        valid_teams.add(8230115)
        valid_teams.add(8262639)
        valid_teams.add(8607159)
        valid_teams.add(8604954)
        valid_teams.add(8581426)
        valid_teams.add(8606828)
        valid_teams.add(8261882)
    }

    teams_request.onload = function() {
        const data = teams_request.response;
        for (let i = 0; i < data.length; i++) {
            if (LEAGUE_ID === 13740 || LEAGUE_ID === 13742) {
                if (!valid_teams.has(data[i].team_id)) {
                    continue
                }
            }
            if (data[i].team_id === 8261500) { //because xtreme gaming is cringe
                data[i].name = "Xtreme Gaming"
            }

            id_to_team[data[i].team_id] = data[i].name
            team_to_id[data[i].name] = data[i].team_id
            match_table[data[i].team_id] = {}
            for (let j = 0; j < data.length; j++) {
                if (LEAGUE_ID === 13740 || LEAGUE_ID === 13742) {
                    if (!valid_teams.has(data[j].team_id)) {
                        continue
                    }
                }
                if (i !== j) {
                    match_table[data[i].team_id][data[j].team_id] = -1
                }
            }
            team_to_img[data[i].team_id] = data[i].logo_url
            team_ratings[data[i].team_id] = data[i].rating
        }

        let matches_request = new XMLHttpRequest();
        matches_request.open('GET', `https://api.opendota.com/api/leagues/${LEAGUE_ID}/matches`)

        matches_request.responseType = 'json'
        matches_request.send()

        matches_request.onload = function() {
            const data = matches_request.response;
            for (let i = 0; i < data.length; i++) {
                if (LEAGUE_ID === 13740 || LEAGUE_ID === 13742) {
                    if (!valid_teams.has(data[i].radiant_team_id) || !valid_teams.has(data[i].dire_team_id)) {
                        continue
                    }
                }
                if (match_table[data[i].radiant_team_id][data[i].dire_team_id] === -1) {
                    match_table[data[i].radiant_team_id][data[i].dire_team_id] = 0
                    match_table[data[i].dire_team_id][data[i].radiant_team_id] = 0
                }

                if (data[i].radiant_win) {
                    match_table[data[i].radiant_team_id][data[i].dire_team_id] += 1
                }
                else {
                    match_table[data[i].dire_team_id][data[i].radiant_team_id] += 1
                }
            }

            //HARD CODE MISTAKES
            if (LEAGUE_ID === 13712) {
                match_table[7391077][7119077] = 2 // TP vs Lava
                match_table[7119077][7298091] = 2 // Lava vs Noping
            }
            else if (LEAGUE_ID === 13709) {
                match_table[7422789][8255888] = 2 // Unique (Mind Games) forfeit game 1 vs HellRaisers
            }
            else if (LEAGUE_ID === 13716) {
                match_table[6209804][5] = 2 // RNG 2-1 iG
            }
            else if (LEAGUE_ID === 13740) {
                match_table[8390848][8597391] = 2 // CF 2-0 CHILLAX
                match_table[8605863][8112124] = 1 // Entity 1-2 Brame
                match_table[8261397][8598715] = 0 // NoBountyHunter FF-W Into the Breach
                match_table[8597391][8261397] = 2 // CHILLAX W-FF NoBountyHunter
                match_table[8261397][8597391] = 0  // NoBountyHunter FF-W CHILLAX
                match_table[8112124][8261397] = 2 // Brame W-FF NoBountyHunter
                match_table[8261397][8112124] = 0  // NoBountyHunter FF-W Brame
                match_table[8390848][8261397] = 2 // Chicken Fighters W-FF NoBountyHunter
                match_table[8261397][8390848] = 0  // NoBountyHunter FF-W Chicken Fighters
                match_table[8605863][8261397] = 2 // Entity W-FF NoBountyHunter
                match_table[8261397][8605863] = 0  // NoBountyHunter FF-W Entity

                match_table[8598715][8343488] = 2 // ITB 2 - 0 GF (tiebreaks)
                match_table[8605863][8390848] = 2 // Entity 2 - 0 CF (tiebreaks)
                match_table[8112124][8390848] = 1 // Brame 1 - 2 CF (tiebreaks)
                match_table[8605863][8112124] = 1 // Entity 0 - 2 Brame (tiebreaks)

            }
            else if (LEAGUE_ID === 13717) {
                match_table[1520578][7356881] = 0 // CDEC FF-W SHENZHEN
                match_table[7356881][1520578] = 2 // SHENZHEN w-FF CDEC
            }
            else if (LEAGUE_ID === 13713) {
                match_table[1061269][6767209] = 2 // Our Way (Wolf Team) 2 - 1 Inverse
                match_table[6767209][1061269] = 1 // Inverse 1 - 2 Our Way
            }
            else if (LEAGUE_ID === 13741) {
                match_table[8260983][39] = 0 // Undying 0-2 EG
                match_table[7819028][8376426] = 2 // 4Zoomers 2-0 Wildcard Gaming
            }
            else if (LEAGUE_ID === 13738) {
                match_table[2586976][7554697] = 2 // OG 2 - 0 Nigma (tiebreak)
                match_table[1838315][7554697] = 0 // Secret 0 - 2 Nigma (tiebreak)
                match_table[8291895][2586976] = 2 // Tundra 2 - 0 OG (tiebreak)
                match_table[2586976][1838315] = 2 // OG 2 - 0 Secret (tiebreak)
                match_table[8291895][7554697] = 2 // Tundra 2 - 0 Nigma (tiebreak)
                match_table[8291895][1838315] = 1 // Tundra 1 - 2 Secret (tiebreak)
            }
            else if (LEAGUE_ID === 13747) {
                match_table[8360138][8261197] = 2 // Neon 2 - 1 Motivate
                match_table[8360138][8254145] = 1 // Neon 1 - 2 Execration
                match_table[8254145][8261197] = 0 // Execration 0 - 2 Motivate

                match_table[350190][8244493] = 0 // Fnatic 0 - 2 SMG
                match_table[350190][8214850] = 2 // Fnatic 2 - 1 T1
                match_table[8214850][8244493] = 2 // T1 2 - 0 SMG
            }
            else if (LEAGUE_ID === 13748) {
                match_table[8572181][8571960] = 2 // Nigma 2 - 1 Ragdoll
                match_table[8261554][8605296] = 2 // AG 2 - 0 Spawn
            }

            //

            // console.log(match_table)

            for (const [key, value] of Object.entries(match_table)) {
                original_matches[key] = {...value}
            }

            let standings = []

            for (const [team_name, val] of Object.entries(match_table)) {
                let wins = 0
                let matches = 0
                let map_wins = 0
                let total_maps = 0
                for (const [opp_team, score] of Object.entries(val)) {
                    if (score !== -1) {
                        if (match_table[opp_team][team_name] === 2 || score === 2) {
                            matches += 1
                        }
                        map_wins += score
                        total_maps += (match_table[opp_team][team_name] + score)
                        if (score === 2) {
                            wins += 1
                        }
                    }
                }
                standings.push({'wins': wins, 'matches': matches, 'map_wins': map_wins, 'total_maps': total_maps, 'team_name': team_name})
            }

            // console.log(standings)

            standings.sort(standings_sort)

            tied_places.clear()

            let start_index = 0
            let end_index = 0
            let tie = false

            let curr_dividing_index = 0 // find way to use this

            for (let i = 1; i < standings.length; i++) {
                if (standings[i].wins === standings[i-1].wins && standings[i].matches === standings[i-1].matches) {
                    if (!tie)
                        start_index = i-1
                    tie = true
                }
                else {
                    if (tie) {
                        tie = false
                        end_index = i-1

                        let divide_tie = false

                        for (let j = 0; j < dividing_lines.length; j++) {
                            if (start_index < dividing_lines[j] && dividing_lines[j] <= end_index) {
                                divide_tie = true
                                break
                            }
                        }

                        // console.log(start_index, end_index, divide_tie)

                        if (divide_tie) {
                            for (let ind = start_index; ind <= end_index; ind++) {
                                tied_places.add(standings[ind].team_name)
                            }
                            shuffleArray(standings, end_index, start_index)
                        }
                        else {
                            let divided_teams = []
                            for (let k = start_index; k <= end_index; k++) {
                                divided_teams.push(standings[k])
                            }

                            const new_tiebreak = tiebreak_logic(match_table, divided_teams)
                            for (let ind = 0; ind < new_tiebreak.length; ind++) {
                                standings[ind+start_index] = new_tiebreak[ind]
                            }
                        }
                    }
                }
            }
            if (tie) {
                tie = false
                end_index = standings.length-1

                let divide_tie = false

                for (let j = 0; j < dividing_lines.length; j++) {
                    if (start_index < dividing_lines[j] && dividing_lines[j] <= end_index) {
                        divide_tie = true
                        break
                    }
                }

                if (divide_tie) {
                    for (let ind = start_index; ind <= end_index; ind++) {
                        tied_places.add(standings[ind].team_name)
                    }
                    shuffleArray(standings, end_index, start_index)
                }
                else {
                    let divided_teams = []
                    for (let k = start_index; k <= end_index; k++) {
                        divided_teams.push(standings[k])
                    }

                    const new_tiebreak = tiebreak_logic(match_table, divided_teams)
                    for (let ind = 0; ind < new_tiebreak.length; ind++) {
                        standings[ind+start_index] = new_tiebreak[ind]
                    }
                }
            }

            run_simulations(id_to_team, match_table, standings, MAJOR_SLOTS, 0)

            // console.log(standings)

            for (let i = 0; i < standings.length; i++) {
                // if (i > 0 && standings[i].wins === standings[i-1].wins && standings[i].matches === standings[i-1].matches) {
                //     document.getElementById(`team_${i+1}_place`).innerHTML = document.getElementById(`team_${i}_place`).innerHTML
                // }
                // else {
                    // document.getElementById(`team_${i+1}_place`).innerHTML = (i+1) + "."
                // }
                if (i > 0 && standings[i].wins === standings[i-1].wins && tied_places.has(standings[i].team_name)) {
                    document.getElementById(`team_${i+1}_place`).innerHTML = document.getElementById(`team_${i}_place`).innerHTML
                }
                else {
                    document.getElementById(`team_${i+1}_place`).innerHTML = (i+1) + "."
                }
                document.getElementById(`team_${i+1}_name`).innerHTML = id_to_team[standings[i].team_name]
                document.getElementById(`team_${i+1}_record`).innerHTML = `${standings[i].wins}-${standings[i].matches-standings[i].wins}`
                document.getElementById(`team_${i+1}_map_record`).innerHTML = `${standings[i].map_wins}-${standings[i].total_maps-standings[i].map_wins}`
            }

            let curr_index = 0
            for (const [team1, value] of Object.entries(match_table)) {
                find_match_index[id_to_team[team1]] = {}
                document.getElementById(`team_${curr_index+1}_matches_name`).innerHTML = id_to_team[team1]
                document.getElementById(`team_${curr_index+1}_icon`).src = team_to_img[team1]
                let match_index = 0

                let completed = [] // more efficient sols possible
                let upcoming = []

                for (const [team2, score] of Object.entries(value)) {
                    if (score === -1) {
                        upcoming.push(team2)
                    }
                    else {
                        completed.push(team2)
                    }
                }

                for (let i = 0; i < completed.length; i++) {
                    const team2 = completed[i]
                    find_match_index[id_to_team[team1]][id_to_team[team2]] = [curr_index+1, match_index+1]
                    document.getElementById(`team_${curr_index+1}_match${match_index+1}_team1score`).innerHTML = match_table[team1][team2]
                    document.getElementById(`team_${curr_index+1}_match${match_index+1}_oppscore`).innerHTML = match_table[team2][team1]
                    if (match_table[team1][team2] === 2) {
                        document.getElementById(`team_${curr_index+1}_match${match_index+1}_team1score`).style.backgroundColor = 'lime'
                        document.getElementById(`team_${curr_index+1}_match${match_index+1}_team1name`).style.backgroundColor = 'lime'
                    }
                    else if (match_table[team2][team1] === 2) {
                        document.getElementById(`team_${curr_index+1}_match${match_index+1}_oppscore`).style.backgroundColor = 'lime'
                        document.getElementById(`team_${curr_index+1}_match${match_index+1}_oppname`).style.backgroundColor = 'lime'
                    }
                    document.getElementById(`team_${curr_index+1}_match${match_index+1}_team1name`).innerHTML = id_to_team[team1]
                    document.getElementById(`team_${curr_index+1}_match${match_index+1}_oppname`).innerHTML = id_to_team[team2]
                    match_index += 1
                }

                var table = document.getElementById(`team_${curr_index+1}_matchestable`)
                // console.log(match_index)
                if (match_index === 7) {
                    document.getElementById(`team_${curr_index+1}_upcoming`).classList.add("hidden")
                }
                else {
                    var last_row = table.rows[match_index+2]
                    last_row.parentNode.insertBefore(table.rows[1], last_row);
                }

                for (let i = 0; i < upcoming.length; i++) {
                    const team2 = upcoming[i]
                    find_match_index[id_to_team[team1]][id_to_team[team2]] = [curr_index+1, match_index+1]
                    document.getElementById(`team_${curr_index+1}_match${match_index+1}_team1score`).innerHTML = 0
                    document.getElementById(`team_${curr_index+1}_match${match_index+1}_oppscore`).innerHTML = 0
                    document.getElementById(`team_${curr_index+1}_match${match_index+1}_team1name`).innerHTML = id_to_team[team1]
                    document.getElementById(`team_${curr_index+1}_match${match_index+1}_oppname`).innerHTML = id_to_team[team2]
                    match_index += 1
                }

                curr_index += 1
            }

            document.getElementById("main_body").classList.remove("hidden")
            document.getElementById("loading").classList.add("hidden")

            document.getElementById("round_robin_table").style.animation = "0.5s slidedown"
            document.getElementById("round_robin_table").style.animationFillMode = "forwards"

            document.getElementById("category_table").style.animation = "0.5s slidedown"
            document.getElementById("category_table").style.animationDelay = "0.05s"
            document.getElementById("category_table").style.animationFillMode = "forwards"

            document.getElementById("place_table").style.animation = "0.5s slidedown"
            document.getElementById("place_table").style.animationDelay = "0.1s"
            document.getElementById("place_table").style.animationFillMode = "forwards"

            for (let i = 0; i < 8; i++) {
                document.getElementById(`team_${i+1}_div`).style.animation = "0.5s slidedown"
                document.getElementById(`team_${i+1}_div`).style.animationDelay = `${0.15+(0.05*i)}s`
                document.getElementById(`team_${i+1}_div`).style.animationFillMode = "forwards"
            }
        }
    }
}

function standings_sort(e1, e2) {
    if (e1.wins === e2.wins) {
        if (e1.matches === e2.matches) {
            return 0
            // return Math.random() < Math.random() ? 1 : -1
            // return e1.map_wins < e2.map_wins ? 1 : -1
        }
        return e1.matches > e2.matches ? 1 : -1
    }
    return e1.wins < e2.wins ? 1 : -1
}

function getColor(value) {
    var hue = ((value/100) * 120).toString(10);
    return ["hsl(", hue, ",100%,50%)"].join("");
}

async function run_simulations(teams_dict, curr_matches, curr_standings, MAJOR_SLOTS, update_move) {
    team_to_index = {}
    number_placement = []
    number_category = []
    for (let i = 0; i < curr_standings.length; i++) {
        team_to_index[curr_standings[i].team_name] = i
        number_category.push([0, 0, 0])
        let temp = []
        for (let j = 0; j < curr_standings.length; j++) {
            temp.push(0)
        }
        number_placement.push(temp)
    }

    loop_simuations(teams_dict, curr_matches, curr_standings, MAJOR_SLOTS, team_to_index, number_placement, number_category, 0, update_move)
}

async function loop_simuations(teams_dict, curr_matches, curr_standings, MAJOR_SLOTS, team_to_index, number_placement, number_category, run_number, update_move) {
    if (run_number < NUM_OF_RUNS && update_move === curr_update) {
        window.requestAnimationFrame(() => {
            for (let run = 0; run < UPDATE_NUM; run++) {
                const new_matches = {}
                let new_standings = []
                for (const [key, value] of Object.entries(curr_matches)) {
                    new_matches[key] = {...value}
                }
                for (const [team1, value] of Object.entries(new_matches)) {
                    let wins = 0
                    let matches = 0
                    let map_wins = 0
                    let total_maps = 0

                    for (const [team2, score] of Object.entries(value)) {
                        if (score === -1) {
                            while (new_matches[team1][team2] !== 2 && new_matches[team2][team1] !== 2) {
                                if (Math.random() < win_probability(team1, team2)) {
                                    new_matches[team1][team2] += 1
                                }
                                else {
                                    new_matches[team2][team1] += 1
                                }
                            }
                        }
                        else if (score !== 2 && new_matches[team2][team1] !== 2) {
                            while (new_matches[team1][team2] !== 2 && new_matches[team2][team1] !== 2) {
                                if (Math.random() < win_probability(team1, team2)) {
                                    new_matches[team1][team2] += 1
                                }
                                else {
                                    new_matches[team2][team1] += 1
                                }
                            }
                        }

                        if (new_matches[team2][team1] === 2 || new_matches[team1][team2] === 2) {
                            matches += 1
                        }
                        map_wins += new_matches[team1][team2]
                        total_maps += (new_matches[team2][team1] + new_matches[team1][team2])
                        if (new_matches[team1][team2] === 2) {
                            wins += 1
                        }

                    }
                    new_standings.push({'wins': wins, 'matches': matches, 'map_wins': map_wins, 'total_maps': total_maps, 'team_name': team1})
                }

                new_standings.sort(standings_sort)

                tied_places.clear()

                let start_index = 0
                let end_index = 0
                let tie = false

                let curr_dividing_index = 0 // find way to use this

                for (let i = 1; i < new_standings.length; i++) {
                    if (new_standings[i].wins === new_standings[i-1].wins && new_standings[i].matches === new_standings[i-1].matches) {
                        if (!tie)
                            start_index = i-1
                        tie = true
                    }
                    else {
                        if (tie) {
                            tie = false
                            end_index = i-1

                            let divide_tie = false

                            for (let j = 0; j < dividing_lines.length; j++) {
                                if (start_index < dividing_lines[j] && dividing_lines[j] <= end_index) {
                                    divide_tie = true
                                    break
                                }
                            }

                            // console.log(start_index, end_index, divide_tie)

                            if (divide_tie) {
                                shuffleArray(new_standings, end_index, start_index)
                            }
                            else {
                                let divided_teams = []
                                for (let k = start_index; k <= end_index; k++) {
                                    divided_teams.push(new_standings[k])
                                }

                                const new_tiebreak = tiebreak_logic(new_matches, divided_teams)
                                for (let ind = 0; ind < new_tiebreak.length; ind++) {
                                    new_standings[ind+start_index] = new_tiebreak[ind]
                                }
                            }
                        }
                    }
                }
                if (tie) {
                    tie = false
                    end_index = new_standings.length-1

                    let divide_tie = false

                    for (let j = 0; j < dividing_lines.length; j++) {
                        if (start_index < dividing_lines[j] && dividing_lines[j] <= end_index) {
                            divide_tie = true
                            break
                        }
                    }

                    if (divide_tie) {
                        shuffleArray(new_standings, end_index, start_index)
                    }
                    else {
                        let divided_teams = []
                        for (let k = start_index; k <= end_index; k++) {
                            divided_teams.push(new_standings[k])
                        }

                        const new_tiebreak = tiebreak_logic(new_matches, divided_teams)
                        for (let ind = 0; ind < new_tiebreak.length; ind++) {
                            new_standings[ind+start_index] = new_tiebreak[ind]
                        }
                    }
                }

                for (let i = 0; i < new_standings.length; i++) {
                    number_placement[team_to_index[new_standings[i].team_name]][i] += 1
                    if (i < MAJOR_SLOTS) {
                        number_category[team_to_index[new_standings[i].team_name]][0] += 1
                    }
                    else if (i < new_standings.length-2) {
                        number_category[team_to_index[new_standings[i].team_name]][1] += 1
                    }
                    else {
                        number_category[team_to_index[new_standings[i].team_name]][2] += 1
                    }
                }
            }

            run_number += UPDATE_NUM

            for (let i = 0; i < number_category.length; i++) {
                const percent1 = (number_category[i][0]*1.0 / run_number)*100
                document.getElementById(`team_${i+1}_major_chance`).style.backgroundColor = getColor(percent1)
                document.getElementById(`team_${i+1}_major_chance`).innerHTML = `${percent1.toFixed(2)}%`
                document.getElementById(`team_${i+1}_major_chance`).classList.remove("font-bold")

                const percent2 = (number_category[i][1]*1.0 / run_number)*100
                document.getElementById(`team_${i+1}_remain_chance`).style.backgroundColor = getColor(percent2)
                document.getElementById(`team_${i+1}_remain_chance`).innerHTML = `${percent2.toFixed(2)}%`
                document.getElementById(`team_${i+1}_remain_chance`).classList.remove("font-bold")

                const percent3 = (number_category[i][2]*1.0 / run_number)*100
                document.getElementById(`team_${i+1}_relegation_chance`).style.backgroundColor = getColor(percent3)
                document.getElementById(`team_${i+1}_relegation_chance`).innerHTML = `${percent3.toFixed(2)}%`
                document.getElementById(`team_${i+1}_relegation_chance`).classList.remove("font-bold")

                if (percent1 > percent2 && percent1 > percent3) {
                    document.getElementById(`team_${i+1}_major_chance`).classList.add("font-bold")
                }
                else if (percent2 > percent1 && percent2 > percent3) {
                    document.getElementById(`team_${i+1}_remain_chance`).classList.add("font-bold")
                }
                else if (percent3 > percent1 && percent3 > percent2) {
                    document.getElementById(`team_${i+1}_relegation_chance`).classList.add("font-bold")
                }

                let max_index = -1
                let max_num = -1
                for (let j = 0; j < number_placement[i].length; j++) {
                    document.getElementById(`team_${i+1}_place${j+1}`).style.backgroundColor = getColor(((number_placement[i][j]*1.0 / run_number)*100))
                    document.getElementById(`team_${i+1}_place${j+1}`).innerHTML = `${((number_placement[i][j]*1.0 / run_number)*100).toFixed(2)}%`
                    document.getElementById(`team_${i+1}_place${j+1}`).classList.remove("font-bold")

                    if (number_placement[i][j] > max_num) {
                        max_num = number_placement[i][j]
                        max_index = j
                    }
                }
                document.getElementById(`team_${i+1}_place${max_index+1}`).classList.add("font-bold")
            }

            loop_simuations(teams_dict, curr_matches, curr_standings, MAJOR_SLOTS, team_to_index, number_placement, number_category, run_number, update_move)
        })
    }

    // console.log(number_placement)
}

function win_probability(team1, team2) {
    return 0.5
    // return 1.0 / (Math.pow(10, ((team_ratings[team1]-team_ratings[team2])*-1.0) / 1000) + 1)
}

function tiebreak_logic(matches, tiebreak_teams) {
    // console.log(tiebreak_teams)
    const h2h_score = []
    const h2h_maps = {}
    const map_diff_total = {}
    const team_order = []
    for (let i = 0; i < tiebreak_teams.length+1; i++) {
        h2h_score.push([])
    }

    for (let i = 0; i < tiebreak_teams.length; i++) {
        let curr_score = 0
        let map_diff = 0
        for (let j = 0; j < tiebreak_teams.length; j++) {
            if (j === i) continue
            if (matches[tiebreak_teams[i].team_name][tiebreak_teams[j].team_name] === -1) continue
            // console.log(tiebreak_teams[i], tiebreak_teams[j])
            if (matches[tiebreak_teams[i].team_name][tiebreak_teams[j].team_name] === 2) {
                curr_score += 1
            }
            map_diff += (matches[tiebreak_teams[i].team_name][tiebreak_teams[j].team_name] - matches[tiebreak_teams[j].team_name][tiebreak_teams[i].team_name])
        }

        h2h_score[curr_score].push(tiebreak_teams[i])

        if (!(map_diff in h2h_maps)) {
            h2h_maps[map_diff] = []
        }
        h2h_maps[map_diff].push(tiebreak_teams[i])
    }

    // console.log(h2h_score)
    // console.log(h2h_maps)

    let next_step = false

    for (let i = h2h_score.length-1; i >= 0; i--) {
        if (h2h_score[i].length > 0) {
            if (h2h_score[i].length === 1) {
                team_order.push(h2h_score[i][0])
            }
            else {
                if (h2h_score[i].length === tiebreak_teams.length) {
                    next_step = true
                    break
                }
                else {
                    const new_tiebreak = tiebreak_logic(matches, h2h_score[i])
                    for (let j = 0; j < new_tiebreak.length; j++) {
                        team_order.push(new_tiebreak[j])
                    }
                }
            }
        }
    }

    // console.log(team_order)

    if (!next_step) {
        return team_order
    }

    next_step = false

    for (let i = tiebreak_teams.length*2; i >= tiebreak_teams.length*-2; i--) {
        if (i in h2h_maps) {
            if (h2h_maps[i].length === 1) {
                team_order.push(h2h_maps[i][0])
            }
            else {
                if (h2h_maps[i].length === tiebreak_teams.length) {
                    next_step = true
                    break
                }
                else {
                    const new_tiebreak = tiebreak_logic(matches, h2h_maps[i])
                    for (let j = 0; j < new_tiebreak.length; j++) {
                        team_order.push(new_tiebreak[j])
                    }
                }
            }
        }
    }

    // console.log(team_order)

    if (!next_step) {
        return team_order
    }

    for (let i = 0; i < tiebreak_teams.length; i++) {
        let curr_score = 0

        for (const [team2, score] of Object.entries(matches[tiebreak_teams[i].team_name])) {
            if (matches[tiebreak_teams[i].team_name][team2] === -1) continue
            curr_score += (matches[tiebreak_teams[i].team_name][team2] - matches[team2][tiebreak_teams[i].team_name])
        }

        // console.log(curr_score)

        if (!(curr_score in map_diff_total)) {
            map_diff_total[curr_score] = []
        }
        map_diff_total[curr_score].push(tiebreak_teams[i])
    }

    // console.log(map_diff_total)

    next_step = false

    for (let i = 14; i >= -14; i--) {
        if (i in map_diff_total) {
            if (map_diff_total[i].length === 1) {
                team_order.push(map_diff_total[i][0])
            }
            else {
                if (map_diff_total[i].length === tiebreak_teams.length) {
                    next_step = true
                    break
                }
                else {
                    const new_tiebreak = tiebreak_logic(matches, map_diff_total[i])
                    for (let j = 0; j < new_tiebreak.length; j++) {
                        team_order.push(new_tiebreak[j])
                    }
                }
            }
        }
    }

    // console.log(team_order)

    if (!next_step) {
        return team_order
    }

    // console.log(team_order)

    for (let i = 0; i < tiebreak_teams.length; i++) {
        tied_places.add(tiebreak_teams[i].team_name)
    }

    shuffleArray(tiebreak_teams, tiebreak_teams.length-1, 0)
    return tiebreak_teams
}

async function change_score(id) {
    const curr_team = parseInt(id.charAt(5))
    const match_num = parseInt(id.charAt(12))
    const team1 = id.indexOf('opp') === -1

    curr_update += 1

    const team_name = document.getElementById(`team_${curr_team}_match${match_num}_team1name`).innerHTML
    const opp_name = document.getElementById(`team_${curr_team}_match${match_num}_oppname`).innerHTML

    // console.log(team_name, opp_name)

    if (team1) {
        if (parseInt(document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).innerHTML) === 2) {
            if (parseInt(document.getElementById(`team_${curr_team}_match${match_num}_team1score`).innerHTML) === 1) {
                document.getElementById(`team_${curr_team}_match${match_num}_team1score`).innerHTML = 0
                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppscore`).innerHTML = 0
                match_table[team_to_id[team_name]][team_to_id[opp_name]] = 0
            }
            else {
                document.getElementById(`team_${curr_team}_match${match_num}_team1score`).innerHTML = 1
                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppscore`).innerHTML = 1
                match_table[team_to_id[team_name]][team_to_id[opp_name]] = 1
            }
        }
        else if (parseInt(document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).innerHTML) === 1) {
            document.getElementById(`team_${curr_team}_match${match_num}_team1score`).style.backgroundColor = ''
            document.getElementById(`team_${curr_team}_match${match_num}_team1name`).style.backgroundColor = ''
            document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).style.backgroundColor = ''
            document.getElementById(`team_${curr_team}_match${match_num}_oppname`).style.backgroundColor = ''
            document.getElementById(`team_${curr_team}_match${match_num}_team1score`).innerHTML = 0
            document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).innerHTML = 0

            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1score`).style.backgroundColor = ''
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1name`).style.backgroundColor = ''
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppscore`).style.backgroundColor = ''
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppname`).style.backgroundColor = ''
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppscore`).innerHTML = 0
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1score`).innerHTML = 0

            match_table[team_to_id[team_name]][team_to_id[opp_name]] = -1
            match_table[team_to_id[opp_name]][team_to_id[team_name]] = -1
        }
        else {
            if (parseInt(document.getElementById(`team_${curr_team}_match${match_num}_team1score`).innerHTML) === 2) {
                document.getElementById(`team_${curr_team}_match${match_num}_team1score`).style.backgroundColor = ''
                document.getElementById(`team_${curr_team}_match${match_num}_team1name`).style.backgroundColor = ''
                document.getElementById(`team_${curr_team}_match${match_num}_team1score`).innerHTML = 0

                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppscore`).style.backgroundColor = ''
                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppname`).style.backgroundColor = ''
                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppscore`).innerHTML = 0

                match_table[team_to_id[team_name]][team_to_id[opp_name]] = -1
                match_table[team_to_id[opp_name]][team_to_id[team_name]] = -1
            }
            else {
                document.getElementById(`team_${curr_team}_match${match_num}_team1score`).style.backgroundColor = 'lime'
                document.getElementById(`team_${curr_team}_match${match_num}_team1name`).style.backgroundColor = 'lime'
                document.getElementById(`team_${curr_team}_match${match_num}_team1score`).innerHTML = 2

                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppscore`).style.backgroundColor = 'lime'
                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppname`).style.backgroundColor = 'lime'
                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppscore`).innerHTML = 2

                match_table[team_to_id[team_name]][team_to_id[opp_name]] = 2
                match_table[team_to_id[opp_name]][team_to_id[team_name]] = 0
            }
        }
    }
    else {
        if (parseInt(document.getElementById(`team_${curr_team}_match${match_num}_team1score`).innerHTML) === 2) {
            if (parseInt(document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).innerHTML) === 1) {
                document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).innerHTML = 0
                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1score`).innerHTML = 0

                match_table[team_to_id[opp_name]][team_to_id[team_name]] = 0
            }
            else {
                document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).innerHTML = 1
                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1score`).innerHTML = 1

                match_table[team_to_id[opp_name]][team_to_id[team_name]] = 1
            }
        }
        else if (parseInt(document.getElementById(`team_${curr_team}_match${match_num}_team1score`).innerHTML) === 1) {
            document.getElementById(`team_${curr_team}_match${match_num}_team1score`).style.backgroundColor = ''
            document.getElementById(`team_${curr_team}_match${match_num}_team1name`).style.backgroundColor = ''
            document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).style.backgroundColor = ''
            document.getElementById(`team_${curr_team}_match${match_num}_oppname`).style.backgroundColor = ''
            document.getElementById(`team_${curr_team}_match${match_num}_team1score`).innerHTML = 0
            document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).innerHTML = 0

            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1score`).style.backgroundColor = ''
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1name`).style.backgroundColor = ''
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppscore`).style.backgroundColor = ''
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppname`).style.backgroundColor = ''
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppscore`).innerHTML = 0
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1score`).innerHTML = 0

            match_table[team_to_id[team_name]][team_to_id[opp_name]] = -1
            match_table[team_to_id[opp_name]][team_to_id[team_name]] = -1
        }
        else {
            if (parseInt(document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).innerHTML) === 2) {
                document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).style.backgroundColor = ''
                document.getElementById(`team_${curr_team}_match${match_num}_oppname`).style.backgroundColor = ''
                document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).innerHTML = 0

                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1score`).style.backgroundColor = ''
                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1name`).style.backgroundColor = ''
                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1score`).innerHTML = 0

                match_table[team_to_id[opp_name]][team_to_id[team_name]] = -1
                match_table[team_to_id[team_name]][team_to_id[opp_name]] = -1
            }
            else {
                document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).style.backgroundColor = 'lime'
                document.getElementById(`team_${curr_team}_match${match_num}_oppname`).style.backgroundColor = 'lime'
                document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).innerHTML = 2

                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1score`).style.backgroundColor = 'lime'
                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1name`).style.backgroundColor = 'lime'
                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1score`).innerHTML = 2

                match_table[team_to_id[opp_name]][team_to_id[team_name]] = 2
                match_table[team_to_id[team_name]][team_to_id[opp_name]] = 0
            }
        }
    }

    await change_standings(curr_update)
}

async function change_standings(curr_move) {
    let standings = []

    for (const [team_name, val] of Object.entries(match_table)) {
        let wins = 0
        let matches = 0
        let map_wins = 0
        let total_maps = 0
        for (const [opp_team, score] of Object.entries(val)) {
            if (score !== -1) {
                if (match_table[opp_team][team_name] === 2 || score === 2) {
                    matches += 1
                }
                map_wins += score
                total_maps += (match_table[opp_team][team_name] + score)
                if (score === 2) {
                    wins += 1
                }
            }
        }
        standings.push({'wins': wins, 'matches': matches, 'map_wins': map_wins, 'total_maps': total_maps, 'team_name': team_name})
    }

    standings.sort(standings_sort)

    tied_places.clear()

    let start_index = 0
    let end_index = 0
    let tie = false

    let curr_dividing_index = 0 // find way to use this

    for (let i = 1; i < standings.length; i++) {
        if (standings[i].wins === standings[i-1].wins && standings[i].matches === standings[i-1].matches) {
            if (!tie)
                start_index = i-1
            tie = true
        }
        else {
            if (tie) {
                tie = false
                end_index = i-1

                let divide_tie = false

                for (let j = 0; j < dividing_lines.length; j++) {
                    if (start_index < dividing_lines[j] && dividing_lines[j] <= end_index) {
                        divide_tie = true
                        break
                    }
                }

                // console.log(start_index, end_index, divide_tie)

                if (divide_tie) {
                    for (let ind = start_index; ind <= end_index; ind++) {
                        tied_places.add(standings[ind].team_name)
                    }
                    shuffleArray(standings, end_index, start_index)
                }
                else {
                    let divided_teams = []
                    for (let k = start_index; k <= end_index; k++) {
                        divided_teams.push(standings[k])
                    }

                    const new_tiebreak = tiebreak_logic(match_table, divided_teams)
                    for (let ind = 0; ind < new_tiebreak.length; ind++) {
                        standings[ind+start_index] = new_tiebreak[ind]
                    }
                }
            }
        }
    }
    if (tie) {
        tie = false
        end_index = standings.length-1

        let divide_tie = false

        for (let j = 0; j < dividing_lines.length; j++) {
            if (start_index < dividing_lines[j] && dividing_lines[j] <= end_index) {
                divide_tie = true
                break
            }
        }

        if (divide_tie) {
            for (let ind = start_index; ind <= end_index; ind++) {
                tied_places.add(standings[ind].team_name)
            }
            shuffleArray(standings, end_index, start_index)
        }
        else {
            let divided_teams = []
            for (let k = start_index; k <= end_index; k++) {
                divided_teams.push(standings[k])
            }

            const new_tiebreak = tiebreak_logic(match_table, divided_teams)
            for (let ind = 0; ind < new_tiebreak.length; ind++) {
                standings[ind+start_index] = new_tiebreak[ind]
            }
        }
    }
    for (let i = 0; i < standings.length; i++) {
        // if (i > 0 && standings[i].wins === standings[i-1].wins && standings[i].matches === standings[i-1].matches) {
        //     document.getElementById(`team_${i+1}_place`).innerHTML = document.getElementById(`team_${i}_place`).innerHTML
        // }
        // else {
        //     document.getElementById(`team_${i+1}_place`).innerHTML = (i+1) + "."
        // }
        if (i > 0 && standings[i].wins === standings[i-1].wins && tied_places.has(standings[i].team_name)) {
            document.getElementById(`team_${i+1}_place`).innerHTML = document.getElementById(`team_${i}_place`).innerHTML
        }
        else {
            document.getElementById(`team_${i+1}_place`).innerHTML = (i+1) + "."
        }

        document.getElementById(`team_${i+1}_name`).innerHTML = id_to_team[standings[i].team_name]
        document.getElementById(`team_${i+1}_record`).innerHTML = `${standings[i].wins}-${standings[i].matches-standings[i].wins}`
        document.getElementById(`team_${i+1}_map_record`).innerHTML = `${standings[i].map_wins}-${standings[i].total_maps-standings[i].map_wins}`
    }
    await run_simulations(id_to_team, match_table, standings, MAJOR_SLOTS, curr_move)
}

function shuffleArray(array, start, end) {
    for (let i = start; i > end; i--) {
        const j = Math.floor(Math.random() * (i-end+1)) + end;
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function reset_team(id) {
    const team1 = team_to_id[document.getElementById(`team_${parseInt(id.charAt(5))}_match1_team1name`).innerHTML]

    for (const [team2, score] of Object.entries(original_matches[team1])) {
        let temp = find_match_index[id_to_team[team1]][id_to_team[team2]]
        let curr_index = temp[0]
        let match_index = temp[1]
        // console.log(curr_index, match_index)
        match_table[team1][team2] = original_matches[team1][team2]
        if (score === -1) {
            document.getElementById(`team_${curr_index}_match${match_index}_team1score`).innerHTML = 0
            document.getElementById(`team_${curr_index}_match${match_index}_oppscore`).innerHTML = 0
            document.getElementById(`team_${curr_index}_match${match_index}_oppscore`).style.backgroundColor = ''
            document.getElementById(`team_${curr_index}_match${match_index}_oppname`).style.backgroundColor = ''
            document.getElementById(`team_${curr_index}_match${match_index}_team1score`).style.backgroundColor = ''
            document.getElementById(`team_${curr_index}_match${match_index}_team1name`).style.backgroundColor = ''
        }
        else {
            document.getElementById(`team_${curr_index}_match${match_index}_team1score`).innerHTML = score + ""
            document.getElementById(`team_${curr_index}_match${match_index}_oppscore`).innerHTML = original_matches[team2][team1]
            if (score === 2) {
                document.getElementById(`team_${curr_index}_match${match_index}_team1score`).style.backgroundColor = 'lime'
                document.getElementById(`team_${curr_index}_match${match_index}_team1name`).style.backgroundColor = 'lime'
                document.getElementById(`team_${curr_index}_match${match_index}_oppscore`).style.backgroundColor = ''
                document.getElementById(`team_${curr_index}_match${match_index}_oppname`).style.backgroundColor = ''
            }
            else if (original_matches[team2][team1] === 2) {
                document.getElementById(`team_${curr_index}_match${match_index}_oppscore`).style.backgroundColor = 'lime'
                document.getElementById(`team_${curr_index}_match${match_index}_oppname`).style.backgroundColor = 'lime'
                document.getElementById(`team_${curr_index}_match${match_index}_team1score`).style.backgroundColor = ''
                document.getElementById(`team_${curr_index}_match${match_index}_team1name`).style.backgroundColor = ''
            }
        }

        temp = find_match_index[id_to_team[team2]][id_to_team[team1]]
        curr_index = temp[0]
        match_index = temp[1]
        // console.log(curr_index, match_index)
        match_table[team2][team1] = original_matches[team2][team1]
        if (original_matches[team2][team1] === -1) {
            document.getElementById(`team_${curr_index}_match${match_index}_team1score`).innerHTML = 0
            document.getElementById(`team_${curr_index}_match${match_index}_oppscore`).innerHTML = 0
            document.getElementById(`team_${curr_index}_match${match_index}_oppscore`).style.backgroundColor = ''
            document.getElementById(`team_${curr_index}_match${match_index}_oppname`).style.backgroundColor = ''
            document.getElementById(`team_${curr_index}_match${match_index}_team1score`).style.backgroundColor = ''
            document.getElementById(`team_${curr_index}_match${match_index}_team1name`).style.backgroundColor = ''
        }
        else {
            document.getElementById(`team_${curr_index}_match${match_index}_team1score`).innerHTML = original_matches[team2][team1]
            document.getElementById(`team_${curr_index}_match${match_index}_oppscore`).innerHTML = original_matches[team1][team2]
            if (original_matches[team2][team1] === 2) {
                document.getElementById(`team_${curr_index}_match${match_index}_team1score`).style.backgroundColor = 'lime'
                document.getElementById(`team_${curr_index}_match${match_index}_team1name`).style.backgroundColor = 'lime'
                document.getElementById(`team_${curr_index}_match${match_index}_oppscore`).style.backgroundColor = ''
                document.getElementById(`team_${curr_index}_match${match_index}_oppname`).style.backgroundColor = ''
            }
            else if (original_matches[team1][team2] === 2) {
                document.getElementById(`team_${curr_index}_match${match_index}_oppscore`).style.backgroundColor = 'lime'
                document.getElementById(`team_${curr_index}_match${match_index}_oppname`).style.backgroundColor = 'lime'
                document.getElementById(`team_${curr_index}_match${match_index}_team1score`).style.backgroundColor = ''
                document.getElementById(`team_${curr_index}_match${match_index}_team1name`).style.backgroundColor = ''
            }
        }
    }

    let standings = []

    for (const [team_name, val] of Object.entries(match_table)) {
        let wins = 0
        let matches = 0
        let map_wins = 0
        let total_maps = 0
        for (const [opp_team, score] of Object.entries(val)) {
            if (score !== -1) {
                if (match_table[opp_team][team_name] === 2 || score === 2) {
                    matches += 1
                }
                map_wins += score
                total_maps += (match_table[opp_team][team_name] + score)
                if (score === 2) {
                    wins += 1
                }
            }
        }
        standings.push({'wins': wins, 'matches': matches, 'map_wins': map_wins, 'total_maps': total_maps, 'team_name': team_name})
    }

    // console.log(standings)

    standings.sort(standings_sort)

    tied_places.clear()

    let start_index = 0
    let end_index = 0
    let tie = false

    let curr_dividing_index = 0 // find way to use this

    for (let i = 1; i < standings.length; i++) {
        if (standings[i].wins === standings[i-1].wins && standings[i].matches === standings[i-1].matches) {
            if (!tie)
                start_index = i-1
            tie = true
        }
        else {
            if (tie) {
                tie = false
                end_index = i-1

                let divide_tie = false

                for (let j = 0; j < dividing_lines.length; j++) {
                    if (start_index < dividing_lines[j] && dividing_lines[j] <= end_index) {
                        divide_tie = true
                        break
                    }
                }

                // console.log(start_index, end_index, divide_tie)

                if (divide_tie) {
                    for (let ind = start_index; ind <= end_index; ind++) {
                        tied_places.add(standings[ind].team_name)
                    }
                    shuffleArray(standings, end_index, start_index)
                }
                else {
                    let divided_teams = []
                    for (let k = start_index; k <= end_index; k++) {
                        divided_teams.push(standings[k])
                    }

                    const new_tiebreak = tiebreak_logic(match_table, divided_teams)
                    for (let ind = 0; ind < new_tiebreak.length; ind++) {
                        standings[ind+start_index] = new_tiebreak[ind]
                    }
                }
            }
        }
    }
    if (tie) {
        tie = false
        end_index = standings.length-1

        let divide_tie = false

        for (let j = 0; j < dividing_lines.length; j++) {
            if (start_index < dividing_lines[j] && dividing_lines[j] <= end_index) {
                divide_tie = true
                break
            }
        }

        if (divide_tie) {
            for (let ind = start_index; ind <= end_index; ind++) {
                tied_places.add(standings[ind].team_name)
            }
            shuffleArray(standings, end_index, start_index)
        }
        else {
            let divided_teams = []
            for (let k = start_index; k <= end_index; k++) {
                divided_teams.push(standings[k])
            }

            const new_tiebreak = tiebreak_logic(match_table, divided_teams)
            for (let ind = 0; ind < new_tiebreak.length; ind++) {
                standings[ind+start_index] = new_tiebreak[ind]
            }
        }
    }

    curr_update += 1
    run_simulations(id_to_team, match_table, standings, MAJOR_SLOTS, curr_update)

    for (let i = 0; i < standings.length; i++) {
        // if (i > 0 && standings[i].wins === standings[i-1].wins && standings[i].matches === standings[i-1].matches) {
        //     document.getElementById(`team_${i+1}_place`).innerHTML = document.getElementById(`team_${i}_place`).innerHTML
        // }
        // else {
        //     document.getElementById(`team_${i+1}_place`).innerHTML = (i+1) + "."
        // }
        if (i > 0 && standings[i].wins === standings[i-1].wins && tied_places.has(standings[i].team_name)) {
            document.getElementById(`team_${i+1}_place`).innerHTML = document.getElementById(`team_${i}_place`).innerHTML
        }
        else {
            document.getElementById(`team_${i+1}_place`).innerHTML = (i+1) + "."
        }

        document.getElementById(`team_${i+1}_name`).innerHTML = id_to_team[standings[i].team_name]
        document.getElementById(`team_${i+1}_record`).innerHTML = `${standings[i].wins}-${standings[i].matches-standings[i].wins}`
        document.getElementById(`team_${i+1}_map_record`).innerHTML = `${standings[i].map_wins}-${standings[i].total_maps-standings[i].map_wins}`
    }
}

function reset_all() {
    for (const [team1, value] of Object.entries(original_matches)) {
        for (const [team2, score] of Object.entries(value)) {
            const temp = find_match_index[id_to_team[team1]][id_to_team[team2]]
            const curr_index = temp[0]
            const match_index = temp[1]
            // console.log(curr_index, match_index)
            match_table[team1][team2] = original_matches[team1][team2]
            if (score === -1) {
                document.getElementById(`team_${curr_index}_match${match_index}_team1score`).innerHTML = 0
                document.getElementById(`team_${curr_index}_match${match_index}_oppscore`).innerHTML = 0
                document.getElementById(`team_${curr_index}_match${match_index}_oppscore`).style.backgroundColor = ''
                document.getElementById(`team_${curr_index}_match${match_index}_oppname`).style.backgroundColor = ''
                document.getElementById(`team_${curr_index}_match${match_index}_team1score`).style.backgroundColor = ''
                document.getElementById(`team_${curr_index}_match${match_index}_team1name`).style.backgroundColor = ''
            }
            else {
                document.getElementById(`team_${curr_index}_match${match_index}_team1score`).innerHTML = score + ""
                document.getElementById(`team_${curr_index}_match${match_index}_oppscore`).innerHTML = original_matches[team2][team1]
                if (score === 2) {
                    document.getElementById(`team_${curr_index}_match${match_index}_team1score`).style.backgroundColor = 'lime'
                    document.getElementById(`team_${curr_index}_match${match_index}_team1name`).style.backgroundColor = 'lime'
                    document.getElementById(`team_${curr_index}_match${match_index}_oppscore`).style.backgroundColor = ''
                    document.getElementById(`team_${curr_index}_match${match_index}_oppname`).style.backgroundColor = ''
                }
                else if (original_matches[team2][team1] === 2) {
                    document.getElementById(`team_${curr_index}_match${match_index}_oppscore`).style.backgroundColor = 'lime'
                    document.getElementById(`team_${curr_index}_match${match_index}_oppname`).style.backgroundColor = 'lime'
                    document.getElementById(`team_${curr_index}_match${match_index}_team1score`).style.backgroundColor = ''
                    document.getElementById(`team_${curr_index}_match${match_index}_team1name`).style.backgroundColor = ''
                }
            }
        }
    }

    let standings = []

    for (const [team_name, val] of Object.entries(match_table)) {
        let wins = 0
        let matches = 0
        let map_wins = 0
        let total_maps = 0
        for (const [opp_team, score] of Object.entries(val)) {
            if (score !== -1) {
                if (match_table[opp_team][team_name] === 2 || score === 2) {
                    matches += 1
                }
                map_wins += score
                total_maps += (match_table[opp_team][team_name] + score)
                if (score === 2) {
                    wins += 1
                }
            }
        }
        standings.push({'wins': wins, 'matches': matches, 'map_wins': map_wins, 'total_maps': total_maps, 'team_name': team_name})
    }

    // console.log(standings)

    standings.sort(standings_sort)

    tied_places.clear()

    let start_index = 0
    let end_index = 0
    let tie = false

    let curr_dividing_index = 0 // find way to use this

    for (let i = 1; i < standings.length; i++) {
        if (standings[i].wins === standings[i-1].wins && standings[i].matches === standings[i-1].matches) {
            if (!tie)
                start_index = i-1
            tie = true
        }
        else {
            if (tie) {
                tie = false
                end_index = i-1

                let divide_tie = false

                for (let j = 0; j < dividing_lines.length; j++) {
                    if (start_index < dividing_lines[j] && dividing_lines[j] <= end_index) {
                        divide_tie = true
                        break
                    }
                }

                // console.log(start_index, end_index, divide_tie)

                if (divide_tie) {
                    for (let ind = start_index; ind <= end_index; ind++) {
                        tied_places.add(standings[ind].team_name)
                    }
                    shuffleArray(standings, end_index, start_index)
                }
                else {
                    let divided_teams = []
                    for (let k = start_index; k <= end_index; k++) {
                        divided_teams.push(standings[k])
                    }

                    const new_tiebreak = tiebreak_logic(match_table, divided_teams)
                    for (let ind = 0; ind < new_tiebreak.length; ind++) {
                        standings[ind+start_index] = new_tiebreak[ind]
                    }
                }
            }
        }
    }
    if (tie) {
        tie = false
        end_index = standings.length-1

        let divide_tie = false

        for (let j = 0; j < dividing_lines.length; j++) {
            if (start_index < dividing_lines[j] && dividing_lines[j] <= end_index) {
                divide_tie = true
                break
            }
        }

        if (divide_tie) {
            for (let ind = start_index; ind <= end_index; ind++) {
                tied_places.add(standings[ind].team_name)
            }
            shuffleArray(standings, end_index, start_index)
        }
        else {
            let divided_teams = []
            for (let k = start_index; k <= end_index; k++) {
                divided_teams.push(standings[k])
            }

            const new_tiebreak = tiebreak_logic(match_table, divided_teams)
            for (let ind = 0; ind < new_tiebreak.length; ind++) {
                standings[ind+start_index] = new_tiebreak[ind]
            }
        }
    }

    curr_update += 1
    run_simulations(id_to_team, match_table, standings, MAJOR_SLOTS, curr_update)

    for (let i = 0; i < standings.length; i++) {
        // if (i > 0 && standings[i].wins === standings[i-1].wins && standings[i].matches === standings[i-1].matches) {
        //     document.getElementById(`team_${i+1}_place`).innerHTML = document.getElementById(`team_${i}_place`).innerHTML
        // }
        // else {
        //     document.getElementById(`team_${i+1}_place`).innerHTML = (i+1) + "."
        // }
        if (i > 0 && standings[i].wins === standings[i-1].wins && tied_places.has(standings[i].team_name)) {
            document.getElementById(`team_${i+1}_place`).innerHTML = document.getElementById(`team_${i}_place`).innerHTML
        }
        else {
            document.getElementById(`team_${i+1}_place`).innerHTML = (i+1) + "."
        }

        document.getElementById(`team_${i+1}_name`).innerHTML = id_to_team[standings[i].team_name]
        document.getElementById(`team_${i+1}_record`).innerHTML = `${standings[i].wins}-${standings[i].matches-standings[i].wins}`
        document.getElementById(`team_${i+1}_map_record`).innerHTML = `${standings[i].map_wins}-${standings[i].total_maps-standings[i].map_wins}`
    }
}
