const currentPlayerId =
    Number(localStorage.getItem("currentPlayerId"));

const currentPlayerName =
    localStorage.getItem("currentPlayerName");

document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .getElementById(
                "welcomeText"
            )
            .innerText =
            `Hoşgeldin ${currentPlayerName}`;

        loadEvaluationList();

        document
            .getElementById(
                "prepareTeamsBtn"
            )
            .addEventListener(
                "click",
                () => {

                    window.location.href =
                        "teams.html";

                }
            );

        document
            .getElementById(
                "viewRatingsBtn"
            )
            .addEventListener(
                "click",
                () => {

                    window.location.href =
                        "ratings.html";

                }
            );

    }
);

async function loadEvaluationList() {

    const playerList =
        document.getElementById(
            "playerList"
        );

    playerList.innerHTML = "";

    try {

        const {
            data,
            error
        } =
        await supabaseClient.rpc(
            "get_evaluation_dashboard",
            {
                p_player_id:
                    currentPlayerId
            }
        );

        if (error) {

            console.error(error);

            playerList.innerHTML =
                "<div>Veriler yüklenemedi</div>";

            return;

        }

        const players =
            data.players || [];

        let completed = 0;

        const total =
            players.length;

        for (
            const player
            of players
        ) {

            const row =
                document.createElement(
                    "div"
                );

            row.style.padding =
                "10px";

            row.style.marginBottom =
                "10px";

            row.style.border =
                "1px solid #ddd";

            row.style.borderRadius =
                "8px";

            row.style.cursor =
                "pointer";

            row.style.transition =
                "0.2s";

            if (player.voted) {

                completed++;

                row.innerHTML =
                    `✅ ${player.name}`;

                row.style.background =
                    "#f3fff3";

            } else {

                row.innerHTML =
                    `⬜ ${player.name}`;

            }

            row.addEventListener(
                "mouseenter",
                () => {

                    row.style.background =
                        "#f5f5f5";

                }
            );

            row.addEventListener(
                "mouseleave",
                () => {

                    if (player.voted) {

                        row.style.background =
                            "#f3fff3";

                    } else {

                        row.style.background =
                            "";

                    }

                }
            );

            row.addEventListener(
                "click",
                () => {

                    localStorage.setItem(
                        "targetPlayerId",
                        player.id
                    );

                    localStorage.setItem(
                        "targetPlayerName",
                        player.name
                    );

                    window.location.href =
                        "voting.html";

                }
            );

            playerList.appendChild(
                row
            );

        }

        const percent =
            total === 0
            ? 100
            : Math.round(
                (
                    completed /
                    total
                ) * 100
            );

        document
            .getElementById(
                "progressText"
            )
            .innerText =
            `${completed}/${total} tamamlandı (%${percent})`;

        renderGlobalStatus(
            data
        );

    }
    catch (err) {

        console.error(err);

        playerList.innerHTML =
            "<div>Beklenmeyen hata oluştu</div>";

    }

}

function renderGlobalStatus(
    data
) {

    const globalStatus =
        document.getElementById(
            "globalStatus"
        );

    const playerCount =
        data.totalPlayers || 0;

    const currentVotes =
        data.currentVotes || 0;

    const expectedVotes =
        playerCount *
        (playerCount - 1);

    if (
        expectedVotes > 0 &&
        currentVotes >= expectedVotes
    ) {

        globalStatus.innerHTML =
        `
        <p style="
            color:green;
            font-weight:bold;
            margin-top:15px;
        ">
            ✅ Tüm değerlendirmeler tamamlandı
        </p>
        `;

        document
            .getElementById(
                "prepareTeamsBtn"
            )
            .style.display =
            "block";

        return;

    }

    let html =
    `
    <div style="margin-top:15px;">
        <h3>
            Eksik Değerlendirmeler
        </h3>
    `;

    const stats =
        data.voteStats || [];

    stats.forEach(
        player => {

            const expected =
                playerCount - 1;

            const missing =
                expected -
                Number(
                    player.vote_count || 0
                );

            if (missing > 0) {

                html +=
                `
                <div>
                    ❌ ${player.name}
                    (${missing} eksik)
                </div>
                `;

            }

        }
    );

    html +=
        "</div>";

    const percent =
        expectedVotes === 0
        ? 100
        : Math.round(
            (
                currentVotes /
                expectedVotes
            ) * 100
        );

    html +=
    `
    <div style="
        margin-top:15px;
    ">
        Genel Tamamlanma:
        <b>%${percent}</b>
    </div>
    `;

    globalStatus.innerHTML =
        html;

    document
        .getElementById(
            "prepareTeamsBtn"
        )
        .style.display =
        "none";

}