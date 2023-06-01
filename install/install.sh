#!/usr/bin/env bash
set -euo pipefail

if [[ ${OS:-} = Windows_NT ]]; then
    echo 'error: Please install vedic using Windows Subsystem for Linux'
    exit 1
fi

# Reset
Color_Off=''

# Regular Colors
Red=''
Green=''
Dim='' # White

# Bold
Bold_White=''
Bold_Green=''

if [[ -t 1 ]]; then
    # Reset
    Color_Off='\033[0m' # Text Reset

    # Regular Colors
    Red='\033[0;31m'   # Red
    Green='\033[0;32m' # Green
    Dim='\033[0;2m'    # White

    # Bold
    Bold_Green='\033[1;32m' # Bold Green
    Bold_White='\033[1m'    # Bold White
fi

error() {
    echo -e "${Red}error${Color_Off}:" "$@" >&2
    exit 1
}

info() {
    echo -e "${Dim}$@ ${Color_Off}"
}

info_bold() {
    echo -e "${Bold_White}$@ ${Color_Off}"
}

success() {
    echo -e "${Green}$@ ${Color_Off}"
}

command -v tar >/dev/null ||
    error 'tar is required to install vedic'

command -V curl >/dev/null ||
    error 'curl is required to install vedic'

if [[ $# -gt 1 ]]; then
    error 'Too many arguments, only one argument of specific tag of vedic to install. (e.g. "v2.0.4") is allowed'
fi

case $(uname -ms) in
    'Darwin x86_64')
        target=vedic-darwin-x86_64.tar.gz
        ;;
    'Darwin arm64')
        target=vedic-darwin-aarch64.tar.gz
        ;;
    'Linux aarch64' | 'Linux arm64')
        target=vedic-linux-gnu-aarch64.tar.xz
        ;;
    'Linux i686')
        target=vedic-linux-gnu-i686.tar.xz
        ;;
    'Linux x86_64')
        target=vedic-linux-gnu-x86_64.tar.xz
        ;;
    'Linux armv7')
        target=vedic-linux-gnueabihf-armv7.tar.xz
        ;;
    'Linux x86_64 musl')
        target=vedic-linux-musl-x86_64.tar.xz
        ;;
    *)
        error 'Unsupported OS and architecture combination'
        ;;
esac


if [[ $target = vedic-darwin-x86_64.tar.gz ]]; then
    # Is this process running in Rosetta?
    # redirect stderr to devnull to avoid error message when not running in Rosetta
    if [[ $(sysctl -n sysctl.proc_translated 2>/dev/null) = 1 ]]; then
        target=vedic-darwin-aarch64.tar.gz
        info "Your shell is running in Rosetta 2. Downloading vedic for $target instead"
    fi
fi

GITHUB=${GITHUB-"https://github.com"}

github_repo="$GITHUB/vedic-lang/vedic"

exe_name=vedic

if [[ $# = 0 ]]; then
    vedic_uri=$github_repo/releases/latest/download/$target
else
    vedic_uri=$github_repo/releases/download/$1/$target
fi

install_env=VEDIC_INSTALL
bin_env=\$$install_env/bin

install_dir=${!install_env:-$HOME/.vedic}
bin_dir=$install_dir/bin
exe=$bin_dir/vedic

if [[ ! -d $bin_dir ]]; then
    mkdir -p "$bin_dir" ||
        error "Failed to create install directory \"$bin_dir\""
fi

curl --fail --location --progress-bar --output "$exe.tar.gz" "$vedic_uri" ||
    error "Failed to download vedic from \"$vedic_uri\""

tar -xzf "$exe.tar.gz" -C "$bin_dir" ||
    error 'Failed to extract vedic to destination'

chmod +x "$exe" ||
    error 'Failed to set permissions on vedic executable'

rm -r "$exe.tar.gz"

tildify() {
    if [[ $1 = $HOME/* ]]; then
        local replacement=\~/

        echo "${1/$HOME\//$replacement}"
    else
        echo "$1"
    fi
}

success "vedic was installed successfully to $Bold_Green$(tildify "$exe")"

if command -v vedic >/dev/null; then
    # Install completions, but we don't care if it fails
    IS_VEDIC_AUTO_UPDATE=true $exe completions &>/dev/null || :

    echo "Run 'vedic --help' to get started"
    exit
fi

refresh_command=''

tilde_bin_dir=$(tildify "$bin_dir")
quoted_install_dir=\"${install_dir//\"/\\\"}\"

if [[ $quoted_install_dir = \"$HOME/* ]]; then
    quoted_install_dir=${quoted_install_dir/$HOME\//\$HOME/}
fi

echo

case $(basename "$SHELL") in
fish)
    # Install completions, but we don't care if it fails
    IS_VEDIC_AUTO_UPDATE=true SHELL=fish $exe completions &>/dev/null || :

    commands=(
        "set --export $install_env $quoted_install_dir"
        "set --export PATH $bin_env \$PATH"
    )

    fish_config=$HOME/.config/fish/config.fish
    tilde_fish_config=$(tildify "$fish_config")

    if [[ -w $fish_config ]]; then
        {
            echo -e '\n# vedic'

            for command in "${commands[@]}"; do
                echo "$command"
            done
        } >>"$fish_config"

        info "Added \"$tilde_bin_dir\" to \$PATH in \"$tilde_fish_config\""

        refresh_command="source $tilde_fish_config"
    else
        echo "Manually add the directory to $tilde_fish_config (or similar):"

        for command in "${commands[@]}"; do
            info_bold "  $command"
        done
    fi
    ;;
zsh)
    # Install completions, but we don't care if it fails
    IS_VEDIC_AUTO_UPDATE=true SHELL=zsh $exe completions &>/dev/null || :

    commands=(
        "export $install_env=$quoted_install_dir"
        "export PATH=\"$bin_env:\$PATH\""
    )

    zsh_config=$HOME/.zshrc
    tilde_zsh_config=$(tildify "$zsh_config")

    if [[ -w $zsh_config ]]; then
        {
            echo -e '\n# vedic'

            for command in "${commands[@]}"; do
                echo "$command"
            done
        } >>"$zsh_config"

        info "Added \"$tilde_bin_dir\" to \$PATH in \"$tilde_zsh_config\""

        refresh_command="exec $SHELL"
    else
        echo "Manually add the directory to $tilde_zsh_config (or similar):"

        for command in "${commands[@]}"; do
            info_bold "  $command"
        done
    fi
    ;;
bash)
    commands=(
        "export $install_env=$quoted_install_dir"
        "export PATH=$bin_env:\$PATH"
    )

    bash_configs=(
        "$HOME/.bashrc"
        "$HOME/.bash_profile"
    )

    if [[ ${XDG_CONFIG_HOME:-} ]]; then
        bash_configs+=(
            "$XDG_CONFIG_HOME/.bash_profile"
            "$XDG_CONFIG_HOME/.bashrc"
            "$XDG_CONFIG_HOME/bash_profile"
            "$XDG_CONFIG_HOME/bashrc"
        )
    fi

    set_manually=true
    for bash_config in "${bash_configs[@]}"; do
        tilde_bash_config=$(tildify "$bash_config")

        if [[ -w $bash_config ]]; then
            {
                echo -e '\n# vedic'

                for command in "${commands[@]}"; do
                    echo "$command"
                done
            } >>"$bash_config"

            info "Added \"$tilde_bin_dir\" to \$PATH in \"$tilde_bash_config\""

            refresh_command="source $bash_config"
            set_manually=false
            break
        fi
    done

    if [[ $set_manually = true ]]; then
        echo "Manually add the directory to $tilde_bash_config (or similar):"

        for command in "${commands[@]}"; do
            info_bold "  $command"
        done
    fi
    ;;
*)
    echo 'Manually add the directory to ~/.bashrc (or similar):'
    info_bold "  export $install_env=$quoted_install_dir"
    info_bold "  export PATH=\"$bin_env:\$PATH\""
    ;;
esac

echo
info "To get started, run:"
echo

if [[ $refresh_command ]]; then
    info_bold " $refresh_command"
fi

info_bold "  vedic --help"
