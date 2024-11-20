const caseData = {
    caseName: "The Cross-Network Terrorist Operation",
    caseDescription:
      "This case involves a large-scale investigation into a potential terrorist network operating across the United States, linked to foreign terrorist organizations, money laundering, and weapons trafficking.This case involves a high-profile jewel heist in which a precious diamond went missing from a museum exhibit.",
    insights: [
      "	Money Laundering Connection: Atticus Lincoln, owner of Select Gourmet Foods in Virginia, is potentially involved in money laundering through deposits from foreign accounts in Egypt and the UAE. These deposits were made to his account at First Union National Bank, which has a history of suspicious activity. Erica Hahn, who has deposited checks from this same account, adds another layer of suspicion, suggesting that she may be involved in the same money laundering scheme.",
      "	Terrorist Financing and Forged Identities: Levi Schmitt, using an alias, is connected to both domestic and international activities, including ties to Preston Burke, a former Taliban fighter. Schmitt’s alias links him to Atticus Lincoln, who shares connections to suspect financial activities. Additionally, the forged identity of Mark Sloan (also known as Owen Hunt), who has received explosives training and overstayed his visa, signals potential involvement in a larger terrorist network. Mark Sloan works for Empire State Vending Services, the same employer as Levi Schmitt, creating a potential collaboration between these individuals.",
      "	Suspicious Phone Activity: Atticus Lincoln’s phone number has been associated with multiple calls to various locations, including to Levi Schmitt’s residence and to overseas numbers in the Netherlands. The content of the Arabic message suggests coordination of a meeting or operation on April 30. These calls, along with the connection to international locations, suggest a planned operation or coordination with a wider network.",
      "	Explosives and Weapon Trafficking: A U-Haul truck abandoned near a military reservation in Denver contained land mines, rented by Masood Yaser. His name also appears in connection with forged documents linked to passport fraud. Furthermore, a shipment of Stinger missiles addressed to New Jersey from Germany highlights the movement of military-grade weapons. This could be part of a broader network involved in both trafficking weapons and planning attacks, as evidenced by the connection to missing Taliban weapons.",
      "	Suspected Terrorist Activity: The discovery of C-4 explosives at Erica Hahn’s carpet shop in North Bergen, combined with her sudden disappearance, raises concerns about her involvement in an imminent attack. The fire at the shop and the cartons marked “PRIVATE: DO NOT OPEN” containing explosives suggest a deliberate attempt to conceal dangerous materials. Her unexplained vacation to Canada, paired with her financial links to Atticus Lincoln, positions her as a suspect in both terrorist financing and operational activities.",
      "	International Terrorist Network: Preston Burke and Tom Koracick, both former Taliban fighters, have strong ties to Levi Schmitt and Atticus Lincoln. The alias connections between these individuals hint at a coordinated international network that spans multiple countries. Their presence in the U.S. under forged identities and connections to explosives and financial crimes further reinforce the threat of terrorist activity being orchestrated across borders.",
      "	Weapons and Explosives Procurement: The intercepted messages and anomalies in phone activity point to ongoing procurement of weapons and explosives. The FBI’s observation of a rental truck in Los Angeles carrying flight schedules and maps near LAX, as well as the apprehension of individuals involved, suggests reconnaissance for a potential attack involving aviation. This, coupled with the movement of weapons in Denver and explosives in New Jersey, indicates widespread preparation for multiple, simultaneous attacks.",
      "	Cross-Network Ties and Coordinated Operations: Levi Schmitt, Mark Sloan, and Derek Shepherd, all individuals with questionable backgrounds, have managed to obtain access to high-security locations like the New York Stock Exchange under false pretenses. This raises concerns about a larger, coordinated effort to gain access to critical infrastructure for potentially malicious purposes. Their employment in seemingly unrelated services, such as vending machines, may be a cover for more nefarious activities.",
      "	Links to Hezbollah and South America: The failed car bomb attack near the American Diplomatic Mission in Buenos Aires, involving Hezbollah operative Jamil Musawi, and the discovery of military-grade explosives in various U.S. locations reveal the global reach of terrorist organizations. This network seems to have a presence in Latin America and links to U.S.-based operatives, with ties extending as far as Afghanistan and Germany.",
    
    ],
    detailedSummary: `The Cross-Network Terrorist Operation case revolves around a series of interconnected criminal activities involving money laundering, forged identities, weapons trafficking, and potential terrorist attacks. Atticus Lincoln’s business activities and suspicious foreign bank deposits suggest his involvement in laundering money through a network of foreign banks. His link to Erica Hahn, who deposited checks from the same account and was found connected to explosives in her store, hints at a broader terrorist financing scheme. Meanwhile, Levi Schmitt and Mark Sloan, both employed by Empire State Vending Services, are using forged identities and are connected to individuals with terrorist training. The discovery of land mines in Denver and Stinger missiles shipped to New Jersey raises concerns about the group’s involvement in weapons trafficking. Further investigation is needed to unravel the full scope of this operation, including the possibility of coordinated attacks within the United States.`,
  };
  
  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("case-name").textContent = caseData.caseName;
    document.getElementById("case-description").textContent =
      caseData.caseDescription;
  
    const insightsList = document.getElementById("insights-list");
    caseData.insights.forEach((insight) => {
      const li = document.createElement("li");
      li.textContent = insight;
      insightsList.appendChild(li);
    });
  
    document.getElementById("detailed-summary-text").textContent =
      caseData.detailedSummary;
  });
  
  function printReport() {
    const notes = document.getElementById("notes-text").value;
    const notesSection = document.createElement("div");
    notesSection.innerHTML = `<p>${notes}</p>`;
    document.body.appendChild(notesSection);
    window.print();
  }
  