const id_to_team = {}
const team_to_id = {}
const match_table = {}
const find_match_index = {}
let MAJOR_SLOTS = 0

function load_tables(LEAGUE_ID, slots) {
    MAJOR_SLOTS = slots
    let teams_request = new XMLHttpRequest();
    teams_request.open('GET', `https://api.opendota.com/api/leagues/${LEAGUE_ID}/teams`);

    teams_request.responseType = 'json';
    teams_request.send()

    teams_request.onload = function() {
        const data = teams_request.response;
        console.log(data)

        for (let i = 0; i < data.length; i++) {
            id_to_team[data[i].team_id] = data[i].name
            team_to_id[data[i].name] = data[i].team_id
            match_table[data[i].team_id] = {}
            for (let j = 0; j < data.length; j++) {
                if (i !== j) {
                    match_table[data[i].team_id][data[j].team_id] = -1
                }
            }
        }

        console.log(id_to_team)
        console.log(match_table)

        let matches_request = new XMLHttpRequest();
        matches_request.open('GET', `https://api.opendota.com/api/leagues/${LEAGUE_ID}/matches`)

        matches_request.responseType = 'json'
        matches_request.send()

        matches_request.onload = function() {
            const data = matches_request.response;
            for (let i = 0; i < data.length; i++) {
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
                match_table[7391077][7119077] = 2 //TP vs Lava
            }
            else if (LEAGUE_ID === 13709) {
                match_table[7422789][8255888] = 2 //Unique (Mind Games) forfeit game 1 vs HellRaisers
            }
            //

            console.log(match_table)
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

            console.log(standings)

            standings.sort(standings_sort)

            console.log(standings)

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

            run_simulations(id_to_team, match_table, standings, MAJOR_SLOTS)

            let curr_index = 0
            for (const [team1, value] of Object.entries(match_table)) {
                find_match_index[id_to_team[team1]] = {}
                document.getElementById(`team_${curr_index+1}_matches_name`).innerHTML = id_to_team[team1]
                let match_index = 0
                for (const [team2, score] of Object.entries(value)) {
                    find_match_index[id_to_team[team1]][id_to_team[team2]] = [curr_index+1, match_index+1]
                    if (score === -1) {
                        document.getElementById(`team_${curr_index+1}_match${match_index+1}_team1score`).innerHTML = 0
                        document.getElementById(`team_${curr_index+1}_match${match_index+1}_oppscore`).innerHTML = 0
                    }
                    else {
                        document.getElementById(`team_${curr_index+1}_match${match_index+1}_team1score`).innerHTML = score + ""
                        document.getElementById(`team_${curr_index+1}_match${match_index+1}_oppscore`).innerHTML = match_table[team2][team1]
                        if (score === 2) {
                            document.getElementById(`team_${curr_index+1}_match${match_index+1}_team1score`).style.backgroundColor = 'lime'
                            document.getElementById(`team_${curr_index+1}_match${match_index+1}_team1name`).style.backgroundColor = 'lime'
                        }
                        else if (match_table[team2][team1] === 2) {
                            document.getElementById(`team_${curr_index+1}_match${match_index+1}_oppscore`).style.backgroundColor = 'lime'
                            document.getElementById(`team_${curr_index+1}_match${match_index+1}_oppname`).style.backgroundColor = 'lime'
                        }
                    }
                    document.getElementById(`team_${curr_index+1}_match${match_index+1}_team1name`).innerHTML = id_to_team[team1]
                    document.getElementById(`team_${curr_index+1}_match${match_index+1}_oppname`).innerHTML = id_to_team[team2]
                    match_index += 1
                }
                curr_index += 1
            }
        }
    }
}

function standings_sort(e1, e2) {
    if (e1.wins === e2.wins) {
        if (e1.matches === e2.matches) {
            return Math.random() < Math.random() ? 1 : -1
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

function run_simulations(teams_dict, curr_matches, curr_standings, MAJOR_SLOTS) {
    const NUM_OF_RUNS = 10000
    const UPDATE_NUM = 50000

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

    for (let run = 0; run < NUM_OF_RUNS; run++) {
        const new_matches = {}
        for (const [key, value] of Object.entries(curr_matches)) {
            new_matches[key] = {...value}
        }
        // console.log(curr_matches)
        // console.log(new_matches)
        if (run > 0 && run % UPDATE_NUM === 0) {
            // for (let i = 0; i < number_category.length; i++) {
            //     const percent1 = (number_category[i][0]*1.0 / run)*100
            //     document.getElementById(`team_${i+1}_major_chance`).style.backgroundColor = getColor(percent1)
            //     document.getElementById(`team_${i+1}_major_chance`).innerHTML = `${percent1.toFixed(2)}%`
            //     const percent2 = (number_category[i][1]*1.0 / run)*100
            //     document.getElementById(`team_${i+1}_remain_chance`).style.backgroundColor = getColor(percent2)
            //     document.getElementById(`team_${i+1}_remain_chance`).innerHTML = `${percent2.toFixed(2)}%`
            //     const percent3 = (number_category[i][2]*1.0 / run)*100
            //     document.getElementById(`team_${i+1}_relegation_chance`).style.backgroundColor = getColor(percent3)
            //     document.getElementById(`team_${i+1}_relegation_chance`).innerHTML = `${percent3.toFixed(2)}%`

            //     for (let j = 0; j < number_placement[i].length; j++) {
            //         document.getElementById(`team_${i+1}_place${j+1}`).style.backgroundColor = getColor(((number_placement[i][j]*1.0 / run)*100))
            //         document.getElementById(`team_${i+1}_place${j+1}`).innerHTML = `${((number_placement[i][j]*1.0 / run)*100).toFixed(2)}%`
            //     }
            // }
            console.log(run)
        }

        for (const [team1, value] of Object.entries(new_matches)) {
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
            }
        }

        let new_standings = []

        for (const [team_name, val] of Object.entries(new_matches)) {
            let wins = 0
            let matches = 0
            let map_wins = 0
            let total_maps = 0
            for (const [opp_team, score] of Object.entries(val)) {
                if (score !== -1) {
                    if (new_matches[opp_team][team_name] === 2 || score === 2) {
                        matches += 1
                    }
                    map_wins += score
                    total_maps += (new_matches[opp_team][team_name] + score)
                    if (score === 2) {
                        wins += 1
                    }
                }
            }
            new_standings.push({'wins': wins, 'matches': matches, 'map_wins': map_wins, 'total_maps': total_maps, 'team_name': team_name})
        }

        new_standings.sort(standings_sort)

        console.log("new")
        console.log(new_standings)

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

    for (let i = 0; i < number_category.length; i++) {
        const percent1 = (number_category[i][0]*1.0 / NUM_OF_RUNS)*100
        document.getElementById(`team_${i+1}_major_chance`).style.backgroundColor = getColor(percent1)
        document.getElementById(`team_${i+1}_major_chance`).innerHTML = `${percent1.toFixed(2)}%`
        const percent2 = (number_category[i][1]*1.0 / NUM_OF_RUNS)*100
        document.getElementById(`team_${i+1}_remain_chance`).style.backgroundColor = getColor(percent2)
        document.getElementById(`team_${i+1}_remain_chance`).innerHTML = `${percent2.toFixed(2)}%`
        const percent3 = (number_category[i][2]*1.0 / NUM_OF_RUNS)*100
        document.getElementById(`team_${i+1}_relegation_chance`).style.backgroundColor = getColor(percent3)
        document.getElementById(`team_${i+1}_relegation_chance`).innerHTML = `${percent3.toFixed(2)}%`

        for (let j = 0; j < number_placement[i].length; j++) {
            document.getElementById(`team_${i+1}_place${j+1}`).style.backgroundColor = getColor(((number_placement[i][j]*1.0 / NUM_OF_RUNS)*100))
            document.getElementById(`team_${i+1}_place${j+1}`).innerHTML = `${((number_placement[i][j]*1.0 / NUM_OF_RUNS)*100).toFixed(2)}%`
        }
    }

    console.log(number_placement)
}

function change_score(id) {
    const curr_team = parseInt(id.charAt(5))
    const match_num = parseInt(id.charAt(12))
    const team1 = id.indexOf('opp') === -1
    console.log(curr_team, match_num, team1)

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
            document.getElementById(`team_${curr_team}_match${match_num}_team1score`).style.backgroundColor = 'white'
            document.getElementById(`team_${curr_team}_match${match_num}_team1name`).style.backgroundColor = 'white'
            document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).style.backgroundColor = 'white'
            document.getElementById(`team_${curr_team}_match${match_num}_oppname`).style.backgroundColor = 'white'
            document.getElementById(`team_${curr_team}_match${match_num}_team1score`).innerHTML = 0
            document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).innerHTML = 0

            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1score`).style.backgroundColor = 'white'
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1name`).style.backgroundColor = 'white'
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppscore`).style.backgroundColor = 'white'
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppname`).style.backgroundColor = 'white'
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppscore`).innerHTML = 0
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1score`).innerHTML = 0

            match_table[team_to_id[team_name]][team_to_id[opp_name]] = -1
            match_table[team_to_id[opp_name]][team_to_id[team_name]] = -1
        }
        else {
            if (parseInt(document.getElementById(`team_${curr_team}_match${match_num}_team1score`).innerHTML) === 2) {
                document.getElementById(`team_${curr_team}_match${match_num}_team1score`).style.backgroundColor = 'white'
                document.getElementById(`team_${curr_team}_match${match_num}_team1name`).style.backgroundColor = 'white'
                document.getElementById(`team_${curr_team}_match${match_num}_team1score`).innerHTML = 0

                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppscore`).style.backgroundColor = 'white'
                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppname`).style.backgroundColor = 'white'
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
            document.getElementById(`team_${curr_team}_match${match_num}_team1score`).style.backgroundColor = 'white'
            document.getElementById(`team_${curr_team}_match${match_num}_team1name`).style.backgroundColor = 'white'
            document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).style.backgroundColor = 'white'
            document.getElementById(`team_${curr_team}_match${match_num}_oppname`).style.backgroundColor = 'white'
            document.getElementById(`team_${curr_team}_match${match_num}_team1score`).innerHTML = 0
            document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).innerHTML = 0

            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1score`).style.backgroundColor = 'white'
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1name`).style.backgroundColor = 'white'
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppscore`).style.backgroundColor = 'white'
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppname`).style.backgroundColor = 'white'
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_oppscore`).innerHTML = 0
            document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1score`).innerHTML = 0

            match_table[team_to_id[team_name]][team_to_id[opp_name]] = -1
            match_table[team_to_id[opp_name]][team_to_id[team_name]] = -1
        }
        else {
            if (parseInt(document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).innerHTML) === 2) {
                document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).style.backgroundColor = 'white'
                document.getElementById(`team_${curr_team}_match${match_num}_oppname`).style.backgroundColor = 'white'
                document.getElementById(`team_${curr_team}_match${match_num}_oppscore`).innerHTML = 0

                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1score`).style.backgroundColor = 'white'
                document.getElementById(`team_${find_match_index[opp_name][team_name][0]}_match${find_match_index[opp_name][team_name][1]}_team1name`).style.backgroundColor = 'white'
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

    console.log(match_table)

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

    console.log(standings)

    standings.sort(standings_sort)

    console.log(standings)

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
    run_simulations(id_to_team, match_table, standings, MAJOR_SLOTS)
}

function shuffleArray(array, start, end) {
    for (let i = start; i > end; i--) {
        const j = Math.floor(Math.random() * (start-end+1)) + end;
        [array[i], array[j]] = [array[j], array[i]];
    }
}
