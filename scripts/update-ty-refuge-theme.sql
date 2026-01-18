-- Update Ty Refuge restaurant theme to match the premium dark gold aesthetic
-- Based on the Ty Refuge theme files provided

UPDATE restaurant_settings
SET 
    -- Colors - Ty Refuge Dark Theme
    primary_color = '#c9a227',           -- Gold accent
    primary_hover_color = '#b87333',     -- Copper hover
    accent_color = '#c9a227',            -- Gold accent
    background_color = '#1a1612',        -- Deep dark background
    surface_color = '#2a241e',           -- Warm dark card background
    text_color = '#f5f0e8',              -- Light cream text
    text_muted_color = '#a69d90',        -- Muted secondary text
    border_color = '#3d3426', -- Subtle gold border (dark gold)
    
    -- Fonts - Elegant typography
    font_display = 'Cormorant Garamond, serif',
    font_body = 'DM Sans, sans-serif'
WHERE restaurant_id = (
    SELECT id FROM restaurants WHERE slug = 'ty-refuge'
);

-- Verify the update
SELECT 
    r.name,
    r.slug,
    rs.primary_color,
    rs.background_color,
    rs.surface_color,
    rs.text_color
FROM restaurants r
JOIN restaurant_settings rs ON r.id = rs.restaurant_id
WHERE r.slug = 'ty-refuge';
