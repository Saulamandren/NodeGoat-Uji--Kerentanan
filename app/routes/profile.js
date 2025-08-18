const ProfileDAO = require("../data/profile-dao").ProfileDAO;
const ESAPI = require("node-esapi");
const {
    environmentalScripts
} = require("../../config/config");

/* The ProfileHandler must be constructed with a connected db */
function ProfileHandler(db) {
    "use strict";

    const profile = new ProfileDAO(db);

    this.displayProfile = (req, res, next) => {
        const { userId } = req.session;

        profile.getByUserId(parseInt(userId), (err, doc) => {
            if (err) return next(err);
            doc.userId = userId;

            // Fix XSS vulnerability: Contextually encode for HTML (for website field)
            doc.website = ESAPI.encoder().encodeForHTML(doc.website);

            return res.render("profile", {
                ...doc,
                environmentalScripts
            });
        });
    };

    this.handleProfileUpdate = (req, res, next) => {

        const { firstName, lastName, ssn, dob, address, bankAcc, bankRouting } = req.body;

        // Fix for Section: ReDoS attack
        // Optimized the regex to avoid exponential backtracking
        const regexPattern = /^[0-9]+\#$/; // Match only numbers followed by a single '#'

        // Validate the bankRouting number using the fixed regex
        const testComplyWithRequirements = regexPattern.test(bankRouting);
        
        if (!testComplyWithRequirements) {
            const firstNameSafeString = firstName;
            return res.render("profile", {
                updateError: "Bank Routing number does not comply with requirements for format specified",
                firstNameSafeString,
                lastName,
                ssn,
                dob,
                address,
                bankAcc,
                bankRouting,
                environmentalScripts
            });
        }

        const { userId } = req.session;

        profile.updateUser(
            parseInt(userId),
            firstName,
            lastName,
            ssn,
            dob,
            address,
            bankAcc,
            bankRouting,
            (err, user) => {
                if (err) return next(err);

                user.updateSuccess = true;
                user.userId = userId;

                return res.render("profile", {
                    ...user,
                    environmentalScripts
                });
            }
        );
    };
}

module.exports = ProfileHandler;
