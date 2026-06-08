{% macro validate_geometry(geometry_column) %}
    ST_IsValid({{ geometry_column }}) AS is_valid,
    ST_IsValidReason({{ geometry_column }}) AS validity_reason
{% endmacro %}