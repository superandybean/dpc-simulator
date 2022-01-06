const main_container = document.createElement("div")
main_container.classList.add("flex", "flex-col", "lg:flex-row")

const left_tables = document.createElement("div")
left_tables.classList.add("flex", "flex-col", "md:flex-row")

const first_table = document.createElement("table")
first_table.classList.add("mx-2")

const first_table_head = document.createElement("tr")
first_table_head.classList.add("mb-1")

const first_table_head_element = document.createElement("th")
first_table_head_element.classList.add("text-center", "px-2")
first_table_head_element.colSpan = 6
first_table_head_element.innerHTML = "Round Robin"

first_table_head.appendChild(first_table_head_element)
first_table.appendChild(first_table_head)

for (let i = 1; i <= 8; i++) {
    const tr = document.createElement("tr")

    const td_1 = document.createElement("td")
    td_1.classList.add("px-2")
    td_1.id = `team_${i}_place`
    tr.appendChild(td_1)

    const td_2 = document.createElement("td")
    td_2.colSpan = 3
    td_2.id = `team_${i}_name`
    td_2.classList.add("pl-4")
    tr.appendChild(td_2)

    const td_3 = document.createElement("td")
    td_3.classList.add("px-4")
    td_3.id = `team_${i}_record`
    tr.appendChild(td_3)

    const td_4 = document.createElement("td")
    td_4.id = `team_${i}_map_record`
    tr.appendChild(td_4)

    first_table.appendChild(tr)
}

left_tables.appendChild(first_table)

const category_chance_table = document.createElement("table")
category_chance_table.classList.add("mx-2")

const category_head = document.createElement("tr")
category_head.classList.add("mb-1")

const th_1 = document.createElement("th")
th_1.classList.add("px-2")
th_1.innerHTML = "Promotion"
category_head.appendChild(th_1)

const th_2 = document.createElement("th")
th_2.classList.add("px-2")
th_2.innerHTML = "Remain"
category_head.appendChild(th_2)

const th_3 = document.createElement("th")
th_3.classList.add("px-2")
th_3.innerHTML = "Elimination"
category_head.appendChild(th_3)

category_chance_table.appendChild(category_head)

for (let i = 1; i <= 8; i++) {
    const tr = document.createElement("tr")

    const td_1 = document.createElement("td")
    td_1.classList.add("px-2", "text-center")
    td_1.id = `team_${i}_major_chance`
    tr.appendChild(td_1)

    const td_2 = document.createElement("td")
    td_2.classList.add("px-2", "text-center")
    td_2.id = `team_${i}_remain_chance`
    tr.appendChild(td_2)

    const td_3 = document.createElement("td")
    td_3.classList.add("px-2", "text-center")
    td_3.id = `team_${i}_relegation_chance`
    tr.appendChild(td_3)

    category_chance_table.appendChild(tr)
}

left_tables.appendChild(category_chance_table)
main_container.appendChild(left_tables)

const place_div = document.createElement("div")
place_div.classList.add("overflow-x-auto")

const place_table = document.createElement("table")
place_table.classList.add("mx-2")

const place_head_tr = document.createElement("tr")
place_head_tr.classList.add("mb-1")

for (let i = 1; i <= 8; i++) {
    const th = document.createElement("th")
    th.classList.add("text-center")
    th.innerHTML = i
    place_head_tr.appendChild(th)
}

place_table.appendChild(place_head_tr)

for (let i = 1; i <= 8; i++) {
    const tr = document.createElement("tr")
    for (let j = 1; j <= 8; j++) {
        const td = document.createElement("td")
        td.classList.add("text-center", "px-2")
        td.id = `team_${i}_place${j}`
        tr.appendChild(td)
    }
    place_table.appendChild(tr)
}

place_div.appendChild(place_table)
main_container.appendChild(place_div)

const team_container = document.createElement("div")
team_container.classList.add("grid", "grid-cols-1", "md:grid-cols-2", "lg:grid-cols-4", "gap-y-2", "pt-4")

for (let i = 1; i <= 8; i++) {
    const team_div = document.createElement("div")
    team_div.classList.add("w-full", "px-2", "py-2")

    const team_header = document.createElement("div")
    team_header.classList.add("font-bold", "text-2xl", "flex", "align-center", "items-center", "justify-center", "text-center")

    const team_icon = document.createElement("img")
    team_icon.id = `team_${i}_icon`
    team_icon.style.height = '30px'
    team_header.appendChild(team_icon)

    const team_span = document.createElement('span')
    team_span.classList.add('px-4')
    team_span.id = `team_${i}_matches_name`
    team_header.appendChild(team_span)

    team_div.appendChild(team_header)

    const matches_div = document.createElement('div')
    matches_div.classList.add("pt-2", "items-center", "justify-center")

    const matches_tables = document.createElement("table")
    matches_tables.classList.add("mx-auto")

    for (let j = 1; j <= 7; j++) {
        const tr = document.createElement("tr")

        const td_1 = document.createElement("td")
        td_1.classList.add("px-2", "cursor-pointer", "text-right")
        td_1.id = `team_${i}_match${j}_team1name`
        td_1.onclick = function() { change_score(this.id) }
        tr.appendChild(td_1)

        const td_2 = document.createElement("td")
        td_2.classList.add("px-2", "cursor-pointer", "text-center")
        td_2.id = `team_${i}_match${j}_team1score`
        td_2.onclick = function() { change_score(this.id) }
        tr.appendChild(td_2)

        const td_3 = document.createElement("td")
        td_3.classList.add("px-2", "text-center")
        td_3.innerHTML = '-'
        tr.appendChild(td_3)

        const td_4 = document.createElement("td")
        td_4.classList.add("px-2", "cursor-pointer", "text-center")
        td_4.id = `team_${i}_match${j}_oppscore`
        td_4.onclick = function() { change_score(this.id) }
        tr.appendChild(td_4)

        const td_5 = document.createElement("td")
        td_5.classList.add("px-2", "cursor-pointer", "text-left")
        td_5.id = `team_${i}_match${j}_oppname`
        td_5.onclick = function() { change_score(this.id) }
        tr.appendChild(td_5)

        matches_tables.appendChild(tr)
    }

    matches_div.appendChild(matches_tables)
    team_div.appendChild(matches_div)

    team_container.appendChild(team_div)
}

document.getElementById("main_body").appendChild(main_container)
document.getElementById("main_body").appendChild(team_container)
