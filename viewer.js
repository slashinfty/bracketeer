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
    const database = firebase.database();

    // Get initial data
    var data, pairingsTable, standingsTable;
    const select = document.getElementById('tournament');
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
        let tableData;
        if (url.searchParams.has('data')) tableData = data[url.searchParams.get('data')];
        pairingsTable = $('#pairings').DataTable({
            data: tableData !== undefined ? tableData.pairings : {},
            scrollY: '290px',
            scrollCollapse: true,
            paging: false,
            columns: tableData !== undefined ? tableData.columns.pairings : {}
        });
        standingsTable = $('#standings').DataTable({
            data: tableData !== undefined ? tableData.standings : {},
            scrollY: '290px',
            scrollCollapse: true,
            paging: false,
            columns: tableData !== undefined ? tableData.columns.standings : {}
        });
        // Redraw tables when values updated
        var ref = database.ref('tournaments/' + select.value);
        ref.on('value', snapshot => {
            const update = snapshot.val();
            if (update === null) {
                alert('The tournament is now over.');
                pairingsTable.clear().draw();
                standingsTable.clear().draw();
                return;
            }
            pairingsTable.clear().rows.add(update.pairings).draw();
            standingsTable.clear().rows.add(update.standings).draw();
        });
    });
});