var database, data, pairingsTable, standingsTable;
const select = document.getElementById('tournament');

$(document).ready(() => {
    // Firebase configuration
    var firebaseConfig = {
        apiKey: "AIzaSyDHF0Y3_9jGK36heIMdtjU1y2Mf2oou1Fw",
        authDomain: "bracketeer-22018.firebaseapp.com",
        databaseURL: "https://bracketeer-22018-default-rtdb.firebaseio.com",
        projectId: "bracketeer-22018",
        storageBucket: "bracketeer-22018.appspot.com",
        messagingSenderId: "633046274851",
        appId: "1:633046274851:web:f42e6fb356e6ea94a7b296",
        measurementId: "G-RMXF948GSQ"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();

    // Get initial data
    database.ref('tournaments').get().then(snapshot => {
        data = snapshot.val();
        // Fill dropdown with tournaments
        for (const prop in data) {
            const opt = document.createElement('option');
            opt.value = prop;
            opt.text = data[prop].name;
            select.add(opt);
        }

        // Load table if search params present
        let url = new URL(window.location.href);
        if (url.searchParams.has('data')) select.value = url.searchParams.get('data');

        var ref = database.ref('tournaments');
        ref.on('value', snap => {
            const tableData = snap.val()[select.value];
            if (select.value.length === 0) {
                return;
            } else if (tableData !== undefined && (pairingsTable === undefined || standingsTable === undefined)) {
                pairingsTable = $('#pairings').DataTable({
                    data: tableData.pairings,
                    scrollY: '290px',
                    scrollCollapse: true,
                    paging: false,
                    responsive: true,
                    columns: tableData.columns.pairings
                });
                standingsTable = $('#standings').DataTable({
                    data: tableData.standings,
                    scrollY: '290px',
                    scrollCollapse: true,
                    paging: false,
                    responsive: true,
                    columns: tableData.columns.standings
                });
            } else {
                if (tableData === undefined) {
                    alert('The tournament is now over.');
                    pairingsTable.clear().draw();
                    standingsTable.clear().draw();
                    return;
                }
                try {
                    pairingsTable.clear().rows.add(tableData.pairings).draw();
                } catch (err) {
                    pairingsTable.clear().draw();
                }
                try {
                    standingsTable.clear().rows.add(tableData.standings).draw();
                } catch (err) {
                    standingsTable.clear().draw();
                }
            }
        });
    });
});

const loadTournament = () => {
    database.ref('tournaments/' + select.value).get().then(snapshot => {
        const newEvent = snapshot.val();
        if (newEvent === null) {
            alert('The tournament is now over.');
            pairingsTable.clear().draw();
            standingsTable.clear().draw();
            return;
        }
        if (pairingsTable === undefined || standingsTable === undefined) {
            pairingsTable = $('#pairings').DataTable({
                data: newEvent.pairings,
                scrollY: '290px',
                scrollCollapse: true,
                paging: false,
                responsive: true,
                columns: newEvent.columns.pairings
            });
            standingsTable = $('#standings').DataTable({
                data: newEvent.standings,
                scrollY: '290px',
                scrollCollapse: true,
                paging: false,
                responsive: true,
                columns: newEvent.columns.standings
            });
            return;
        }
        try {
            pairingsTable.clear().rows.add(newEvent.pairings).draw();
        } catch (err) {
            pairingsTable.clear().draw();
        }
        try {
            standingsTable.destroy();
            $('#standings').empty();
            standingsTable = $('#standings').DataTable({
                data: newEvent !== undefined ? newEvent.standings : {},
                scrollY: '290px',
                scrollCollapse: true,
                paging: false,
                columns: newEvent !== undefined ? newEvent.columns.standings : {}
            });
            standingsTable.clear().rows.add(newEvent.standings).draw();
        } catch (err) {
            standingsTable.clear().draw();
        }
    });
}