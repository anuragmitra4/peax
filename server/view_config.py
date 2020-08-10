"""
Copyright 2018 Novartis Institutes for BioMedical Research Inc.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import copy
import numpy as np
from server import bigwig, chromsizes, defaults


def pad_target(pos_from, pos_to, amount=0.1):
    size = pos_to - pos_from
    padding = size * amount
    region = [int(pos_from), pos_to]
    viewport = [pos_from - padding, pos_to + padding]
    return region, viewport


def build(
    datasets,
    config,
    search_info: dict = None,
    domain: list = None,
    incl_predictions: bool = False,
    incl_autoencodings: bool = False,
    incl_selections: bool = False,
    incl_neighborhood: bool = False,
    incl_neighborhood_list: bool = False,
    default: bool = False,
    hide_label: bool = False,
) -> dict:
    view_config = copy.deepcopy(defaults.VIEW_CONFIG)

    determine_x_domain = False
    region = None
    viewport = None

    if search_info is not None:
        region, viewport = pad_target(
            search_info["target_from"], search_info["target_to"]
        )

    if domain is not None:
        region, viewport = pad_target(*domain)

    # Add an empty annotation track for visually highlighting selections
    if incl_selections:
        combined_track_config = copy.deepcopy(defaults.COMBINED_TRACK)
        combined_track_config["uid"] = "selections-combined"

        anno_track_config = copy.deepcopy(defaults.ANNOTATION_TRACK)
        anno_track_config["uid"] = "selections-annotation"

        if region is not None:
            anno_track_config["options"]["regions"].append(region)

        selection_track_config = copy.deepcopy(defaults.SELECTION_TRACK)
        uid = "selections"
        selection_track_config["tilesetUid"] = uid
        selection_track_config["uid"] = uid

        combined_track_config["height"] = selection_track_config.get("height")
        combined_track_config["contents"].extend(
            [anno_track_config, selection_track_config]
        )

        view_config["views"][0]["tracks"]["top"].append(combined_track_config)

    # Add an empty annotation track for visually highlighting labels
    if incl_selections:
        combined_track_config = copy.deepcopy(defaults.COMBINED_TRACK)
        combined_track_config["uid"] = "labels-combined"

        anno_track_config = copy.deepcopy(defaults.ANNOTATION_TRACK)
        anno_track_config["uid"] = "labels-annotation"

        if region is not None:
            anno_track_config["options"]["regions"].append(region)

        selection_track_config = copy.deepcopy(defaults.LABEL_TRACK)
        uid = "labels"
        selection_track_config["tilesetUid"] = uid
        selection_track_config["uid"] = uid

        combined_track_config["height"] = selection_track_config.get("height")
        combined_track_config["contents"].extend(
            [anno_track_config, selection_track_config]
        )

        view_config["views"][0]["tracks"]["top"].append(combined_track_config)

    if incl_predictions:
        combined_track_config = copy.deepcopy(defaults.COMBINED_TRACK)
        combined_track_config["uid"] = "class-probs-combined"

        anno_track_config = copy.deepcopy(defaults.ANNOTATION_TRACK)
        anno_track_config["uid"] = "class-probs-annotation"

        if region is not None:
            anno_track_config["options"]["regions"].append(region)

        probs_heatmap = copy.deepcopy(defaults.CLASS_PROB_TRACK)
        uid = "s{}p".format(search_info["id"])
        probs_heatmap["tilesetUid"] = uid
        probs_heatmap["uid"] = uid

        combined_track_config["height"] = probs_heatmap.get("height")
        combined_track_config["contents"].extend([anno_track_config, probs_heatmap])

        view_config["views"][0]["tracks"]["top"].append(combined_track_config)

    # Add gene annotation track
    if config.coords == "hg19":
        gene_annotation_track = defaults.GENE_ANNOTATION_TRACK_HG19
    elif config.coords == "grch38":
        gene_annotation_track = defaults.GENE_ANNOTATION_TRACK_HG38
    elif config.coords == "mm9":
        gene_annotation_track = defaults.GENE_ANNOTATION_TRACK_MM9
    elif config.coords == "mm10":
        gene_annotation_track = defaults.GENE_ANNOTATION_TRACK_MM10
    else:
        gene_annotation_track = None

    if gene_annotation_track is not None:
        gene_annotation_track = copy.deepcopy(gene_annotation_track)
        gene_annotation_track_config = copy.deepcopy(gene_annotation_track)

        combined_track_config = copy.deepcopy(defaults.COMBINED_TRACK)
        combined_track_config["uid"] = "gene-annotations-combined"

        anno_track_config = copy.deepcopy(defaults.ANNOTATION_TRACK)
        anno_track_config["uid"] = "gene-annotations-annotation"

        if region is not None:
            anno_track_config["options"]["regions"].append(region)

        if default:
            gene_annotation_track_config["height"] *= 3.5
            gene_annotation_track_config["options"]["fontSize"] = 12
            gene_annotation_track_config["options"]["geneAnnotationHeight"] = 12
            gene_annotation_track_config["options"]["geneLabelPosition"] = "outside"
            gene_annotation_track_config["options"]["geneStrandSpacing"] = 3

        if incl_neighborhood_list:
            gene_annotation_track_config["height"] *= 0
            gene_annotation_track_config["options"]["fontSize"] = 0
            gene_annotation_track_config["options"]["geneAnnotationHeight"] = 0
            gene_annotation_track_config["options"]["geneLabelPosition"] = "hidden"
            gene_annotation_track_config["options"]["geneStrandSpacing"] = 0

        combined_track_config["height"] = gene_annotation_track_config.get("height")

        combined_track_config["contents"].extend(
            [anno_track_config, gene_annotation_track_config]
        )

        if not incl_neighborhood_list:
        	view_config["views"][0]["tracks"]["top"].append(combined_track_config)

    # Add separate chrom track when more than 1 dataset is explored
    if datasets.length > 1 and config.coords in chromsizes.SUPPORTED_CHROMOSOMES:
        combined_track_config = copy.deepcopy(defaults.COMBINED_TRACK)
        combined_track_config["uid"] = "chrom-combined"

        anno_track_config = copy.deepcopy(defaults.ANNOTATION_TRACK)
        anno_track_config["uid"] = "chrom-annotation"

        if region is not None:
            anno_track_config["options"]["regions"].append(region)

        if config.coords == "grch38":
            chrom_track = defaults.CHROM_TRACK_HG38
        elif config.coords == "mm9":
            chrom_track = defaults.CHROM_TRACK_MM9
        elif config.coords == "mm10":
            chrom_track = defaults.CHROM_TRACK_MM10
        else:
            chrom_track = defaults.CHROM_TRACK_HG19

        chrom_track = copy.deepcopy(chrom_track)

        # Add the chrom labels to the last track
        combined_track_config["contents"].extend([anno_track_config, chrom_track])

        combined_track_config["height"] = chrom_track.get("height")

        if not incl_neighborhood_list:
        	view_config["views"][0]["tracks"]["top"].append(combined_track_config)

    # Add default top axis track for unknown coords
    if config.coords not in chromsizes.SUPPORTED_CHROMOSOMES:
        combined_track_config = copy.deepcopy(defaults.COMBINED_TRACK)
        combined_track_config["uid"] = "axis-combined"

        anno_track_config = copy.deepcopy(defaults.ANNOTATION_TRACK)
        anno_track_config["uid"] = "axis-annotation"

        if region is not None:
            anno_track_config["options"]["regions"].append(region)

        axis_track = copy.deepcopy(defaults.AXIS_TRACK)

        if default:
            axis_track["height"] = 24
            axis_track["options"]["fontSize"] = 12

        if incl_neighborhood_list:
            axis_track["height"] = 0

        # Add the chrom labels to the last track
        combined_track_config["contents"].extend([anno_track_config, axis_track])

        combined_track_config["height"] = axis_track.get("height")

        if not incl_neighborhood_list:
        	view_config["views"][0]["tracks"]["top"].append(combined_track_config)

    for i, dataset in enumerate(datasets):
        # Determine x-domain limits
        if not determine_x_domain:
            csizes = bigwig.get_chromsizes(dataset.filepath)
            chromcumsizes = np.cumsum(csizes)
            min_x = np.inf
            max_x = 0
            for chrom in config.chroms:
                csz = csizes[chrom]
                ccsz = chromcumsizes[chrom]
                min_x = min(min_x, ccsz - csz)
                max_x = max(max_x, ccsz)

            view_config["views"][0]["initialXDomain"] = [int(min_x), int(max_x)]

            determine_x_domain = True

        if bigwig.is_bigwig(dataset.filepath, dataset.filetype):
            combined_track_config = copy.deepcopy(defaults.COMBINED_TRACK)
            combined_track_config["uid"] = dataset.id + "-combined"

            anno_track_config = copy.deepcopy(defaults.ANNOTATION_TRACK)
            anno_track_config["uid"] = dataset.id + "-annotation"

            if region is not None:
                anno_track_config["options"]["regions"].append(region)

            bw_track_config = copy.deepcopy(defaults.BAR_TRACK)
            bw_track_config["tilesetUid"] = dataset.id
            bw_track_config["uid"] = dataset.id

            if dataset.height:
                bw_track_config["height"] = dataset.height
            else:
                bw_track_config["height"] = defaults.DATA_TRACK_HEIGHTS[
                    min(len(defaults.DATA_TRACK_HEIGHTS), datasets.length) - 1
                ]

            if dataset.fill:
                bw_track_config["options"]["barFillColor"] = dataset.fill
            else:
                color_index = i % len(defaults.DATA_TRACK_COLORS)
                bw_track_config["options"]["barFillColor"] = defaults.DATA_TRACK_COLORS[
                    color_index
                ]

            if dataset.name:
                bw_track_config["options"]["name"] = dataset.name

            if hide_label:
                bw_track_config["options"]["labelPosition"] = "hidden"

            if i % 2 == 1:
                bw_track_config["options"]["axisMargin"] = 48

            if default:
                bw_track_config["height"] *= 3
                bw_track_config["options"]["axisMargin"] = 0
                bw_track_config["options"]["labelPosition"] = "topRight"
                bw_track_config["options"]["labelLeftMargin"] = 0

            if incl_neighborhood or incl_neighborhood_list:
                bw_track_config["height"] /= 3
                bw_track_config["type"] = "1d-heatmap"
                bw_track_config["options"]["axisMargin"] = 0
                bw_track_config["options"]["labelPosition"] = "hidden"
                bw_track_config["options"]["labelLeftMargin"] = 0
                color_index = i % len(defaults.DATA_TRACK_COLORS_NEIGHBORHOOD)
                bw_track_config["options"]["colorRange"] = [
                    "white", 
                    defaults.DATA_TRACK_COLORS_NEIGHBORHOOD[color_index]
                ]

            combined_track_config["height"] = bw_track_config.get("height")
            combined_track_config["contents"].extend(
                [anno_track_config, bw_track_config]
            )

            if incl_autoencodings:
                encodings_track_config = copy.deepcopy(defaults.ENCODINGS_TRACK)
                uid = "{}|ae".format(bw_track_config["uid"])
                encodings_track_config["tilesetUid"] = uid
                encodings_track_config["uid"] = uid
                combined_track_config["contents"].append(encodings_track_config)

            if datasets.size() == 1:
                if config.coords == "grch38":
                    chrom_track = defaults.CHROM_TRACK_HG38
                elif config.coords == "mm9":
                    chrom_track = defaults.CHROM_TRACK_MM9
                elif config.coords == "mm10":
                    chrom_track = defaults.CHROM_TRACK_MM10
                else:
                    chrom_track = defaults.CHROM_TRACK_HG19

                # Add the chrom labels to the last track
                combined_track_config["contents"].append(chrom_track)

            view_config["views"][0]["tracks"]["top"].append(combined_track_config)

            if viewport is not None:
                view_config["views"][0]["initialXDomain"] = viewport

        if config.normalize_tracks:
            view_config["valueScaleLocks"]["locksByViewUid"][
                f"view1.{dataset.id}"
            ] = "a1"
            if "a1" not in view_config["valueScaleLocks"]["locksDict"]:
                view_config["valueScaleLocks"]["locksDict"]["a1"] = {
                    "ignoreOffScreenValues": True
                }
            view_config["valueScaleLocks"]["locksDict"]["a1"][f"view1.{dataset.id}"] = {
                "view": "view1",
                "track": dataset.id,
            }

    return view_config


def combine(view_configs, config):
    combined_view_config = None

    for index, view_config in enumerate(view_configs):
        if combined_view_config is None:
            combined_view_config = view_config
        else:
            view_id = f"view{index + 1}"
            view_config["views"][0]["uid"] = view_id
            combined_view_config["views"].append(view_config["views"][0])

            if config.normalize_tracks:
                for viewTrackId in view_config["valueScaleLocks"]["locksByViewUid"]:
                    key = f"a{index + 1}"
                    ds_id = viewTrackId.split(".")[1]
                    combined_view_config["valueScaleLocks"]["locksByViewUid"][
                        f"view{index + 1}.{ds_id}"
                    ] = key
                    if key not in combined_view_config["valueScaleLocks"]["locksDict"]:
                        combined_view_config["valueScaleLocks"]["locksDict"][key] = {
                            "ignoreOffScreenValues": True
                        }
                    combined_view_config["valueScaleLocks"]["locksDict"][key][
                        f"{view_id}.{ds_id}"
                    ] = {"view": view_id, "track": ds_id}

    return combined_view_config


def height(datasets, config):
    view_config = build(datasets, config)
    total_height = 0

    for track in view_config["views"][0]["tracks"]["top"]:
        total_height += track.get("height", 0)

    extra_target_height = defaults.SELECTION_TRACK.get("height", 0)
    extra_target_height += defaults.LABEL_TRACK.get("height", 0)

    extra_probs_height = defaults.CLASS_PROB_TRACK.get("height", 0)

    target_height = total_height + extra_target_height
    max_height = target_height + extra_probs_height

    return total_height, target_height, max_height

def heightNeighborhood(datasets, config):
    view_config = build(datasets, config, incl_neighborhood=True)
    total_height = 0

    for track in view_config["views"][0]["tracks"]["top"]:
        total_height += track.get("height", 0)

    extra_target_height = defaults.SELECTION_TRACK.get("height", 0)
    extra_target_height += defaults.LABEL_TRACK.get("height", 0)

    extra_probs_height = defaults.CLASS_PROB_TRACK.get("height", 0)

    target_height = total_height + extra_target_height
    max_height = target_height + extra_probs_height

    return total_height, target_height, max_height

def heightNeighborhoodList(datasets, config):
    view_config = build(datasets, config, incl_neighborhood_list=True)
    total_height = 0

    for track in view_config["views"][0]["tracks"]["top"]:
        total_height += track.get("height", 0)

    extra_target_height = defaults.SELECTION_TRACK.get("height", 0)
    extra_target_height += defaults.LABEL_TRACK.get("height", 0)

    extra_probs_height = defaults.CLASS_PROB_TRACK.get("height", 0)

    target_height = total_height + extra_target_height
    max_height = target_height + extra_probs_height

    return total_height, target_height, max_height
