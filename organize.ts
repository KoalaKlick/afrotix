import fs from "fs";
import path from "path";

const targetDir = path.join(process.cwd(), "components", "event");

// Define categories
const folders = {
    charts: [
        "CustomizableEventStats.tsx",
        "TicketTrendChart.tsx",
        "TicketTypeBarChart.tsx",
        "VotingBarChart.tsx",
        "VotingPieChart.tsx",
        "VotingTrendChart.tsx"
    ],
    tabs: [
        "EventOverviewTab.tsx",
        "EventPayoutsTab.tsx",
        "EventSettingsTab.tsx"
    ],
    creation: [
        "CreateEventDrawer.tsx",
        "EventCreationClient.tsx",
        "EventCreationComplete.tsx",
        "EventCreationProgress.tsx",
        "EventStep1BasicInfo.tsx",
        "EventStep2DateLocation.tsx",
        "EventStep3MediaSettings.tsx",
        "EventStep4Extras.tsx"
    ],
    transactions: [
        "EventTransactionsSheet.tsx",
        "NominationTransactionsTable.tsx",
        "TicketTransactionsTable.tsx",
        "VoteTransactionsTable.tsx"
    ],
    members: [
        "MemberBulkImport.tsx",
        "MemberManager.tsx",
        "MemberSheet.tsx"
    ],
    public: [
        "PublicNominationModal.tsx",
        "PublicNomineeSheet.tsx",
        "PublicRegistrationForm.tsx",
        "PublicTicketGrid.tsx",
        "PublicTicketPaymentModal.tsx"
    ],
    settings: [
        "PaymentPlanSettings.tsx",
        "RegistrationFieldManager.tsx"
    ],
    nomination: [
        "NomineeCard.tsx",
        "InternalVoterParticipation.tsx",
        "VotePaymentModal.tsx",
        "CategoryDetailModal.tsx"
    ],
    core: [
        "EventDetailClient.tsx",
        "EventsFilter.tsx",
        "EventsList.tsx",
        "EventStats.tsx",
        "DeleteEventDialog.tsx"
    ]
};

// Create directories and moving files
const fileToFolderMap: Record<string, string> = {};

Object.entries(folders).forEach(([folder, files]) => {
    const folderPath = path.join(targetDir, folder);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    files.forEach((file) => {
        const oldPath = path.join(targetDir, file);
        const newPath = path.join(folderPath, file);
        if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            fileToFolderMap[file] = folder;
        } else if (fs.existsSync(newPath)) {
            fileToFolderMap[file] = folder; // already moved
        }
    });
});

console.log("Moved files, mapping:", fileToFolderMap);

// Update imports
function walkDir(dir: string, callback: (filepath: string) => void) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            walkDir(filepath, callback);
        } else if (stat.isFile() && (filepath.endsWith(".ts") || filepath.endsWith(".tsx"))) {
            callback(filepath);
        }
    }
}

// We need to look through `app`, `components`, `lib`, and update any imports to these components.
// Typical patterns:
// import { Component } from "@/components/event/Component"
// import { Component } from "./Component" (within components/event)
// import { Component } from "../Component" (within components/event/something)

const DIRS_TO_CHECK = [
    path.join(process.cwd(), "app"),
    path.join(process.cwd(), "components"),
    path.join(process.cwd(), "lib")
];

for (const dir of DIRS_TO_CHECK) {
    walkDir(dir, (filepath) => {
        try {
            let content = fs.readFileSync(filepath, "utf8");
            let changed = false;

            // check every file in the map
            for (const [filename, folder] of Object.entries(fileToFolderMap)) {
                const basename = filename.replace(".tsx", "").replace(".ts", "");

                // Match import { ... X ... } from "@/components/event/X" -> "@/components/event/folder/X"
                // Match import X from "@/components/event/X" -> "@/components/event/folder/X"
                const absolutePattern = new RegExp(`@/components/event/${basename}("|')`, "g");
                if (absolutePattern.test(content)) {
                    content = content.replace(absolutePattern, `@/components/event/${folder}/${basename}$1`);
                    changed = true;
                }

                // Relative import from within components/event or subdirectories could be complex
                // Rather than using complex regex, we can also check if we're inside components/event, and just look for imports relative to `basename`
                if (filepath.includes(targetDir)) {
                    // If we are in `components/event/folderA/SomeFile.tsx`
                    // and we import `basename` from another folder: `../folderB/basename`
                    // but previously it was `./basename` or `../basename`.

                    // Let's do a naive replace: 
                    // Previous: `./VotingBarChart` from `components/event/EventOverviewTab.tsx`
                    // New (in tabs folder): `../charts/VotingBarChart`

                    let relativeDir = path.dirname(filepath); // e.g. components/event/tabs
                    let inEventRoot = relativeDir === targetDir;

                    const currentFolderOpt = filepath.replace(targetDir + path.sep, "").split(path.sep)[0];
                    const currentFolder = Object.keys(folders).includes(currentFolderOpt) ? currentFolderOpt : "";

                    // if it ends with .ts/.tsx it's inside `components/event/` 

                    const relativePattern1 = new RegExp(`from (["'])\\./${basename}(["'])`, "g");
                    const relativePattern2 = new RegExp(`from (["'])\\.\\./${basename}(["'])`, "g");
                    const relativePattern3 = new RegExp(`from (["'])\\./\\.\\./${basename}(["'])`, "g"); // maybe unlikely

                    if (currentFolder === folder) {
                        // They are in the same folder now!
                        // import should be `./basename`
                        if (relativePattern1.test(content) || relativePattern2.test(content)) {
                            content = content.replace(relativePattern1, `from $1./${basename}$2`);
                            content = content.replace(relativePattern2, `from $1./${basename}$2`);
                            changed = true;
                        }
                    } else if (currentFolder) {
                        // We are in `components/event/currentFolder`, we need `../folder/basename`
                        const replacement = `from $1../${folder}/${basename}$2`;
                        if (relativePattern1.test(content) || relativePattern2.test(content)) {
                            content = content.replace(relativePattern1, replacement);
                            content = content.replace(relativePattern2, replacement);
                            changed = true;
                        }
                    } else {
                        // We are in `components/event/` root (e.g. index.ts)
                        // `basename` moved inside `folder/basename`
                        const replacement = `from $1./${folder}/${basename}$2`;
                        if (relativePattern1.test(content)) {
                            content = content.replace(relativePattern1, replacement);
                            changed = true;
                        }
                    }
                }
            }

            if (changed) {
                fs.writeFileSync(filepath, content);
            }
        } catch (e) {
            console.error("Failed adjusting", filepath, e);
        }
    });
}

console.log("Done updating imports.");
