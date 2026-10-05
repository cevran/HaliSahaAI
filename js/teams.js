let allPlayers = [];

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadPlayers();

        document
            .getElementById("generateBtn")
            .addEventListener(
                "click",
                generateTeams
            );
    }
);

async function loadPlayers() {

    const container =
        document.getElementById(
            "playersContainer"
        );

    const { data, error } =
        await supabaseClient
            .from("players")
            .select("*")
            .order("name");

    if (error) {

        console.error(error);

        container.innerHTML =
            "Oyuncular yüklenemedi.";

        return;
    }

    allPlayers = data;

    container.innerHTML = "";

    data.forEach(player => {

        const div =
            document.createElement("div");

        div.className =
            "player-item";

        div.innerHTML = `
            <input
                type="checkbox"
                value="${player.id}"
                id="player_${player.id}">

            <label
                for="player_${player.id}">
                ${player.name}
            </label>
        `;

        container.appendChild(div);

    });
}

async function generateTeams() {
    console.log("generateTeams çalıştı");
    const message =
        document.getElementById(
            "validationMessage"
        );

    message.innerHTML = "";

    const selectedIds =
        Array.from(
            document.querySelectorAll(
                'input[type="checkbox"\]:checked'
            )
        ).map(
            x => Number(x.value)
        );

    if (selectedIds.length < 6) {

        message.innerHTML =
            '<div class="warning">En az 6 oyuncu seçmelisiniz.</div>';

        return;
    }

    if (selectedIds.length > 14) {

        message.innerHTML =
            '<div class="warning">En fazla 14 oyuncu seçebilirsiniz.</div>';

        return;
    }

    if (selectedIds.length % 2 !== 0) {

        message.innerHTML =
            '<div class="warning">Oyuncu sayısı çift olmalıdır.</div>';

        return;
    }

    const players =
        await buildPlayerStats(
            selectedIds
        );
    
    console.log(players);

    const alternatives =
        findBestAlternatives(
            players
        );

    renderTeams(
        "alternative1",
        alternatives[0].teamA,
        alternatives[0].teamB
    );

    renderTeams(
        "alternative2",
        alternatives[1].teamA,
        alternatives[1].teamB
    );

    document
        .getElementById(
            "resultsSection"
        )
        .classList.remove(
            "hidden"
        );
}

async function buildPlayerStats(ids) {
    console.log("buildPlayerStats başladı");
    const result = [];

    for (const id of ids) {

        const player =
            allPlayers.find(
                x => x.id === id
            );

        const { data: votes } =
            await supabaseClient
                .from("votes")
                .select("*")
                .eq(
                    "target_id",
                    id
                );

        const avg = field => {

            if (
                !votes ||
                votes.length === 0
            ) {
                return 3;
            }

            return votes.reduce(
                (a, b) =>
                    a + b[field],
                0
            ) / votes.length;
        };

        const condition =
            avg("condition_score");

        const technique =
            avg("technique_score");

        const attack =
            avg("attack_score");

        const defense =
            avg("defense_score");

        const teamplay =
            avg("teamplay_score");

        const power =

            (condition * 1.0) +
            (technique * 1.2) +
            (attack * 1.1) +
            (defense * 1.1) +
            (teamplay * 0.8);
        const attackPower =
            (attack * 0.7) +
            (technique * 0.3);
 
        const defensePower =
            (defense * 0.7) +
            (condition * 0.3);
 
        const midfieldPower =
            (teamplay * 0.4) +
            (technique * 0.3) +
            (condition * 0.3);

        result.push({
 
          id,
          name: player.name,
 
          condition,
          technique,
          attack,
          defense,
          teamplay,
 
          power,
 
          attackPower,
          defensePower,
          midfieldPower
 
        });
    }
    
    console.log(result);
    
    return result;
}

function findBestAlternatives(players) {

    const alternatives = [];

    const ITERATION_COUNT = 5000;

    for (
        let i = 0;
        i < ITERATION_COUNT;
        i++
    ) {

        const shuffled =
            [...players]
            .sort(
                () =>
                    Math.random() - 0.5
            );

        const half =
            shuffled.length / 2;

        const teamA =
            shuffled.slice(
                0,
                half
            );

        const teamB =
            shuffled.slice(
                half
            );

        const statsA =
            teamStats(teamA);

        const statsB =
            teamStats(teamB);

        const powerDiff =
            Math.abs(
                statsA.power -
                statsB.power
            );

        const techniqueDiff =
            Math.abs(
                statsA.technique -
                statsB.technique
            );

        const attackDiff =
            Math.abs(
                statsA.attack -
                statsB.attack
            );

        const defenseDiff =
            Math.abs(
                statsA.defense -
                statsB.defense
            );

        const conditionDiff =
            Math.abs(
                statsA.condition -
                statsB.condition
            );

        const teamplayDiff =
            Math.abs(
                statsA.teamplay -
                statsB.teamplay
            );

        const score =

            (powerDiff * 10) +

            (techniqueDiff * 2) +

            (attackDiff * 2) +

            (defenseDiff * 2) +

            (conditionDiff * 1) +

            (teamplayDiff * 1);

        alternatives.push({

            teamA,
            teamB,
            score

        });
    }

    alternatives.sort(
        (a, b) =>
            a.score -
            b.score
    );

    return [

        alternatives[0],

        alternatives[1]

    ];
}

function teamStats(team) {

    const total = key =>
        team.reduce(
            (a, b) =>
                a + b[key],
            0
        );

    return {

        power:
            total("power"),

        condition:
            total("condition"),

        technique:
            total("technique"),

        attack:
            total("attack"),

        defense:
            total("defense"),

        teamplay:
            total("teamplay")

    };
}

function renderTeams(
    containerId,
    teamA,
    teamB
) {

    const a =
        teamStats(teamA);

    const b =
        teamStats(teamB);

    const diff =
        Math.abs(
            a.power -
            b.power
        );

    const average =
        (a.power + b.power) / 2;

    const percent =
        (diff / average) * 100;

    let comment =
        "✅ Çok Dengeli";

    if (percent <= 1) {

        comment =
            "������ Mükemmele Yakın";

    }
    else if (
        percent <= 3
    ) {

        comment =
            "✅ Çok Dengeli";

    }
    else if (
        percent <= 7
    ) {

        comment =
            "⚠ Dengeli";

    }
    else {

        comment =
            "❌ Dengesiz";
    }

    document
        .getElementById(
            containerId
        )
        .innerHTML = `

<h3>A Takımı</h3>

${renderPitch(teamA)}

<hr>

<b>Toplam Güç:</b>
${a.power.toFixed(1)}

<br><br>

Teknik:
${a.technique.toFixed(1)}

<br>

Hücum:
${a.attack.toFixed(1)}

<br>

Savunma:
${a.defense.toFixed(1)}

<br>

Kondisyon:
${a.condition.toFixed(1)}

<br>

Takım Oyunu:
${a.teamplay.toFixed(1)}

<hr>

<h3>Takım B</h3>

${renderPitch(teamB)}

<hr>

<b>Toplam Güç:</b>
${b.power.toFixed(1)}

<br><br>

Teknik:
${b.technique.toFixed(1)}

<br>

Hücum:
${b.attack.toFixed(1)}

<br>

Savunma:
${b.defense.toFixed(1)}

<br>

Kondisyon:
${b.condition.toFixed(1)}

<br>

Takım Oyunu:
${b.teamplay.toFixed(1)}

<hr>

<b>
Güç Farkı:
%${percent.toFixed(1)}
</b>

<br><br>

${comment}

<br><br>

<b>Analiz</b>

<br>

Teknik Fark:
${Math.abs(
    a.technique -
    b.technique
).toFixed(1)}

<br>

Hücum Fark:
${Math.abs(
    a.attack -
    b.attack
).toFixed(1)}

<br>

Savunma Fark:
${Math.abs(
    a.defense -
    b.defense
).toFixed(1)}

<br>

Kondisyon Fark:
${Math.abs(
    a.condition -
    b.condition
).toFixed(1)}

<br>

Takım Oyunu Fark:
${Math.abs(
    a.teamplay -
    b.teamplay
).toFixed(1)}

`;
}

function buildFormation(team) {

    const available = [...team];

    const goalkeepers = [];
    const defenders = [];
    const midfielders = [];
    const attackers = [];

    function pickBest(pool, field) {

        pool.sort(
            (a, b) => b[field] - a[field]
        );

        return pool.shift();
    }

    // Kaleci

    if (available.length > 0) {

        goalkeepers.push(
            pickBest(
                available,
                "defensePower"
            )
        );
    }

    // Takım büyüklüğüne göre dağılım

    let defenderCount = 1;
    let midfielderCount = 1;

    if (team.length >= 5) {
        defenderCount = 2;
    }

    if (team.length >= 6) {
        midfielderCount = 2;
    }

    // Defans

    for (let i = 0; i < defenderCount; i++) {

        if (available.length === 0) {
            break;
        }

        defenders.push(
            pickBest(
                available,
                "defensePower"
            )
        );
    }

    // Orta saha

    for (let i = 0; i < midfielderCount; i++) {

        if (available.length === 0) {
            break;
        }

        midfielders.push(
            pickBest(
                available,
                "midfieldPower"
            )
        );
    }

    // Kalanlar forvet

    attackers.push(
        ...available.sort(
            (a, b) =>
                b.attackPower -
                a.attackPower
        )
    );

    return {

        goalkeepers,
        defenders,
        midfielders,
        attackers

    };
}


function renderPitch(team) {

    const formation =
        buildFormation(team);

    const renderRow =
        (players, label) =>
            `
            <div class="line">

                ${players.map(
                    p => `

                        <div class="player-card">

                            <div class="player-name">
                                ${p.name}
                            </div>

                            <div class="player-power">
                                ⚡ ${p.power.toFixed(1)}
                            </div>

                            <div class="position-label">
                                ${label}
                            </div>

                        </div>

                    `
                ).join("")}

            </div>
            `;

    return `

        <div class="pitch">

        ${renderRow(
            formation.attackers,
            "⚽FORVET"
        )}

        ${renderRow(
            formation.midfielders,
            "⚽ORTA SAHA"
        )}

        ${renderRow(
            formation.defenders,
            "⚽DEFANS"
        )}

        ${renderRow(
            formation.goalkeepers,
            "⚽KALECI"
        )}

        </div>

    `;
}