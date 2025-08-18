const ResearchDAO = require("../data/research-dao").ResearchDAO;
const needle = require("needle");
const {
    environmentalScripts
} = require("../../config/config");

function ResearchHandler(db) {
    "use strict";

    const researchDAO = new ResearchDAO(db);

    // Daftar domain yang diperbolehkan (whitelist)
    const validDomains = ['example.com', 'trusted-domain.com'];

    this.displayResearch = (req, res) => {
        if (req.query.symbol && req.query.url) {
            const url = req.query.url + req.query.symbol;

            try {
                // Membuat objek URL untuk memvalidasi dan memeriksa hostname
                const urlObj = new URL(url);
                
                // Validasi apakah domain ada di whitelist
                if (!validDomains.includes(urlObj.hostname)) {
                    return res.status(400).send('Invalid domain');
                }

                // Periksa apakah URL mengarah ke server internal atau berpotensi berbahaya
                if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
                    return res.status(400).send('Invalid URL: Localhost addresses are not allowed.');
                }

                // Jika valid, lanjutkan permintaan
                return needle.get(url, (error, newResponse, body) => {
                    if (!error && newResponse.statusCode === 200) {
                        res.writeHead(200, {
                            "Content-Type": "text/html"
                        });
                    }
                    res.write("<h1>The following is the stock information you requested.</h1>\n\n");
                    res.write("\n\n");
                    if (body) {
                        res.write(body);
                    }
                    return res.end();
                });
            } catch (err) {
                return res.status(400).send('Invalid URL');
            }
        }

        return res.render("research", {
            environmentalScripts
        });
    };

}

module.exports = ResearchHandler;
