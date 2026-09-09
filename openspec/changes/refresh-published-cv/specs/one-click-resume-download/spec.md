## ADDED Requirements

### Requirement: The published résumé's stated title matches site positioning
When the pre-approved résumé PDF is replaced, its stated professional title SHALL match `profile.yaml`'s `positioning` field, so a visitor never reads one professional title on the site and downloads a résumé stating another.

#### Scenario: A visitor compares the site to the download
- **WHEN** the résumé PDF is downloaded and its stated professional title is compared against the site's own hero and page-title text
- **THEN** the two agree

#### Scenario: Replacing the résumé updates site copy in the same change
- **WHEN** the pre-approved résumé PDF is replaced with a version stating a different professional title
- **THEN** `profile.yaml`'s `positioning` field, and any content derived from it — including the FAQ answer the chatbot retrieves for identity questions — is updated in that same change, not left to drift until separately noticed
