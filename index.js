const id_to_team = {}
const team_to_id = {}
const match_table = {}
const team_to_img = {}
const find_match_index = {}
let MAJOR_SLOTS = 0
let WILD_CARD = 0
let GROUP_STAGE = 0
let PLAYOFF = 0

const original_matches = {}

const NUM_OF_RUNS = 10000
const UPDATE_NUM = 250

let curr_update = 0

function load_tables(LEAGUE_ID, playoff, groups, wild) {
    PLAYOFF = playoff
    GROUP_STAGE = groups
    WILD_CARD = wild
    MAJOR_SLOTS = PLAYOFF + GROUP_STAGE + WILD_CARD

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
        }

        // console.log(id_to_team)

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
                match_table[8597391][8261397] = 2 // CHILLAX W-FF NoBountyHunter
                match_table[8261397][8597391] = 0  // NoBountyHunter FF-W CHILLAX
            }
            else if (LEAGUE_ID === 13717) {
                match_table[1520578][7356881] = 0 // CDEC FF-W SHENZHEN
                match_table[7356881][1520578] = 2 // SHENZHEN w-FF CDEC
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

            run_simulations(id_to_team, match_table, standings, MAJOR_SLOTS, 0)

            // console.log(standings)

            for (let i = 0; i < standings.length; i++) {
                if (i > 0 && standings[i].wins === standings[i-1].wins && standings[i].matches === standings[i-1].matches) {
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
                            if (Math.random() < 0.5) {
                                new_matches[team1][team2] = 2
                                if (Math.random() < 0.5) {
                                    new_matches[team2][team1] = 1
                                }
                                else {
                                    new_matches[team2][team1] = 0
                                }
                            }
                            else {
                                new_matches[team2][team1] = 2
                                if (Math.random() < 0.5) {
                                    new_matches[team1][team2] = 1
                                }
                                else {
                                    new_matches[team1][team2] = 0
                                }
                            }
                        }
                        else if (score !== 2 && new_matches[team2][team1] !== 2) {
                            while (new_matches[team1][team2] !== 2 && new_matches[team2][team1] !== 2) {
                                if (Math.random() < 0.5) {
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

                let start_index = 0
                let end_index = 0
                let tie = false

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
                            shuffleArray(new_standings, end_index, start_index)
                        }
                    }
                }
                if (tie) {
                    tie = false
                    end_index = new_standings.length-1
                    shuffleArray(new_standings, end_index, start_index)
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

async function change_score(id) {
    const curr_team = parseInt(id.charAt(5))
    const match_num = parseInt(id.charAt(12))
    const team1 = id.indexOf('opp') === -1

    curr_update += 1

    const team_name = document.getElementById(`team_${curr_team}_match${match_num}_team1name`).innerHTML
    const opp_name = document.getElementById(`team_${curr_team}_match${match_num}_oppname`).innerHTML

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

    for (let i = 0; i < standings.length; i++) {
        if (i > 0 && standings[i].wins === standings[i-1].wins && standings[i].matches === standings[i-1].matches) {
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

    curr_update += 1
    run_simulations(id_to_team, match_table, standings, MAJOR_SLOTS, curr_update)

    for (let i = 0; i < standings.length; i++) {
        if (i > 0 && standings[i].wins === standings[i-1].wins && standings[i].matches === standings[i-1].matches) {
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

    curr_update += 1
    run_simulations(id_to_team, match_table, standings, MAJOR_SLOTS, curr_update)

    for (let i = 0; i < standings.length; i++) {
        if (i > 0 && standings[i].wins === standings[i-1].wins && standings[i].matches === standings[i-1].matches) {
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
