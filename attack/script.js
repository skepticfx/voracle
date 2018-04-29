function xhr(url, body) {
    with (new XMLHttpRequest()) {
        open('POST', url);
        send(body.toString())
    }
}

xhr('/', 'abcdefghijklmnopqrstuvqxyz12345678 Cookie: logged_in=584;1')