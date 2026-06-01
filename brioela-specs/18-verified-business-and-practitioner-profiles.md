# 18. Verified Business And Practitioner Profiles

## Goal
Create B2B-facing profiles for restaurants, cloud kitchens, health food stores, creators, nutritionists, and dietitians that plug into the consumer product without changing Brioela into a marketplace first.

## User Outcome
- Consumers discover trusted businesses and practitioners.
- Businesses expose sourcing, ingredient transparency, and health-oriented positioning.
- Practitioners can guide clients using Brioela-linked recommendations.

## In Scope
- Verified map listings.
- Business transparency profile.
- Practitioner-managed recommendations.
- Public creator recipe profiles.

## Out of Scope
- Scheduling, payments, or telehealth.
- Full restaurant operations software.

## Profile Types
- Restaurant or cafe.
- Cloud kitchen or meal prep business.
- Health food store.
- Creator or chef profile.
- Nutritionist or dietitian profile.

## Data Model
- `business_profile`: profile_id, type, owner_id, verification_status, transparency_fields_json.
- `practitioner_profile`: profile_id, license_or_claims, verification_status, client_features_json.
- `featured_listing`: profile_id, place_id, active, rank_inputs_json.

## Integration Points
- Healthy food map.
- Product scan contextual results.
- Community notes.
- Shared recipe discovery.

## Revenue Hooks
- Verified listing subscription.
- Analytics add-on.
- Creator profile tier.
- Practitioner multi-client tier.

## Success Metrics
- Number of verified profiles.
- Consumer interactions per profile.
- B2B conversion rate.
