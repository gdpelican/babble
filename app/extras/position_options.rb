require "enum_site_setting"

module Babble
  class PositionOptions < EnumSiteSetting

    def self.valid_value?(val)
      values.any? { |v| v[:value].to_s == val.to_s }
    end

    def self.values
      @values ||= [
        { name: 'babble.position_left', value: 'left' },
        { name: 'babble.position_right', value: 'right' }
      ]
    end

    def self.translate_names?
      true
    end

  end
end
